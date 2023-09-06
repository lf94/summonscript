const std = @import("std");
const ray = @cImport(@cInclude("raylib.h"));

// When started, the program watches stdin for magic bytes that are randomly generated.
// When finding this, then read in the number of incoming points so memory can
// be allocated, and then read in tuples of points in x,y,z u32 format.
// When reaching the last one go back into "watching" mode.

const START_MAGIC_BYTES = [_]u8 { 0x00, 0xe3, 0x42, 0x61, 0x85, 0x96, 0x41, 0x46, 0x37, 0xc9, 0xfd, 0xa5, 0x51, 0xf9, 0x60, 0x68 };

const State = enum {
  watch_start_magic_bytes,
  read_total_points,
  read_xyz_point
};

pub fn main() !void {
  var gpa = std.heap.GeneralPurposeAllocator(.{}){};
  var allocator = gpa.allocator();

  const screen = .{
    .width = 640,
    .height = 480,
  };

  ray.InitWindow(screen.width, screen.height, "libfive_mesh viewer");
  defer ray.CloseWindow();

  // Define the camera to look into our 3d world
  const camera = ray.Camera3D {
    .position   = .{ .x=0.0, .y=10.0, .z=10.0 }, // Camera position
    .target     = .{ .x=0.0, .y=0.0,  .z=0.0 },  // Camera looking at point
    .up         = .{ .x=0.0, .y=0.0,  .z=-1.0 },  // Camera up vector (rotation towards target)
    .fovy       = 120.0,                         // Camera field-of-view Y
    .projection = ray.CAMERA_PERSPECTIVE,        // Camera mode type
  };

  ray.SetTargetFPS(60);

  var state = State.watch_start_magic_bytes;

  const RPCBuffers =  struct {
    magic_bytes:  [START_MAGIC_BYTES.len]u8,
    total_points: [@sizeOf(u32)]u8,
    xyz_point:    [@sizeOf(u32)*3]u8,
  };

  var buffers = RPCBuffers {
    .magic_bytes  = [_]u8 {0} ** START_MAGIC_BYTES.len,
    .total_points = [_]u8 {0} ** @sizeOf(u32),
    .xyz_point    = [_]u8 {0} ** (@sizeOf(u32) * 3),
  };

  var points_collected: u64 = 0;
  var points_maybe: ?[]ray.Vector3 = null;
  var stream_server = std.net.StreamServer.init(.{});
  const SOCKET_PATH = "./libfive_mesh.sock";
  const socket_address = try std.net.Address.initUnix(SOCKET_PATH);
  defer std.os.unlink(SOCKET_PATH) catch unreachable;
  try stream_server.listen(socket_address);
  defer stream_server.deinit();

  var socket_maybe: ?std.net.StreamServer.Connection = null;

  var pollfd = std.os.pollfd {
    .fd = stream_server.sockfd.?,
    .events = std.os.linux.POLL.ERR | std.os.linux.POLL.IN,
    .revents =  0,
  };

  while (!ray.WindowShouldClose()) {
    ray.BeginDrawing();

    ray.ClearBackground(ray.RAYWHITE);

    ray.BeginMode3D(camera);

    if (points_maybe) |points| {
      if (points.len % 3 != 0) break; // A triangle will be missing a point... Ignore the model.
      ray.DrawTriangleStrip3D(points.ptr, @as(c_int, @intCast(points.len)), ray.GRAY);
    }

    ray.DrawGrid(1000, 1.0);

    ray.EndMode3D();

    ray.EndDrawing();

    var pollfds = [_]std.os.linux.pollfd { pollfd };
    const poll_status = try std.os.poll(&pollfds, 1);
    if (poll_status & std.os.linux.POLL.IN == std.os.linux.POLL.IN) {

      switch(state) {
        .watch_start_magic_bytes => {
          socket_maybe = try stream_server.accept();
          _ = try socket_maybe.?.stream.read(&buffers.magic_bytes);
          if (std.mem.eql(u8, &buffers.magic_bytes, &START_MAGIC_BYTES) == false) continue;
          std.debug.print("watch_start_magic_bytes -> read_total_points transition\n", .{});
          state = .read_total_points;
          _ = try socket_maybe.?.stream.write(&.{1});
          pollfd.events = std.os.linux.POLL.ERR | std.os.linux.POLL.IN;
        },
        .read_total_points => {
          if (socket_maybe) |socket| {
            _ = try socket.stream.read(&buffers.total_points);
            const total_points = std.mem.bytesToValue(u32, &buffers.total_points);
            std.debug.print("points: {}\n", .{ total_points });
            points_maybe = try allocator.alloc(ray.Vector3, total_points);
            std.debug.print("read_total_points -> read_xyz_point transition\n", .{});
              state = .read_xyz_point;
            _ = try socket.stream.write(&.{2});
          }
        },
        .read_xyz_point => {
          if (socket_maybe) |socket| {
            _ = try socket.stream.read(&buffers.xyz_point);
            const x = std.mem.bytesToValue(u32, buffers.xyz_point[0..4]);
            const y = std.mem.bytesToValue(u32, buffers.xyz_point[4..8]);
            const z = std.mem.bytesToValue(u32, buffers.xyz_point[8..12]);
            points_maybe.?[points_collected] = .{ .x = @floatFromInt(x), .y = @floatFromInt(y), .z = @floatFromInt(z) };
            points_collected += 1;

            if (points_collected != points_maybe.?.len) continue;

            state = .watch_start_magic_bytes;
            _ = try socket.stream.write(&.{0});
            socket.stream.close();
          }
        },
      }

    }
  }
}

