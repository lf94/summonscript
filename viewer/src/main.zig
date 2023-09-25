const std = @import("std");
const ray = @cImport(@cInclude("raylib.h"));
const fcntl = @cImport(@cInclude("fcntl.h"));

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

pub const options_override = .{ .io_mode = .evented };

pub fn main() !void {
  var gpa = std.heap.GeneralPurposeAllocator(.{}){};
  var allocator = gpa.allocator();

  const screen = .{
    .width = 640,
    .height = 480,
  };

  ray.SetConfigFlags(ray.FLAG_MSAA_4X_HINT);
  ray.InitWindow(screen.width, screen.height, "libfive_mesh viewer");
  defer ray.CloseWindow();

  // Define the camera to look into our 3d world
  var camera = ray.Camera3D {
    .position   = .{ .x=0.0, .y=-25.0,  .z=5.0 }, // Camera position
    .target     = .{ .x=0.0, .y=0.0,  .z=0.0 }, // Camera looking at point
    .up         = .{ .x=0.0, .y=0.0,  .z=1.0 }, // Camera up vector (rotation towards target)
    .fovy       = 45.0,                         // Camera field-of-view Y
    .projection = ray.CAMERA_PERSPECTIVE,       // Camera mode type
  };

  ray.SetTargetFPS(60);

  var state = State.watch_start_magic_bytes;

  const RPCBuffers =  struct {
    magic_bytes:  [START_MAGIC_BYTES.len]u8,
    total_points: [@sizeOf(u32)]u8,
    xyz_point:    [@sizeOf(f32)*3*3]u8,
  };

  var buffers = RPCBuffers {
    .magic_bytes  = [_]u8 {0} ** START_MAGIC_BYTES.len,
    .total_points = [_]u8 {0} ** @sizeOf(u32),
    .xyz_point    = [_]u8 {0} ** (@sizeOf(f32) * 3 * 3),
  };

  var points_collected: u64 = 0;
  var points_maybe: ?[]ray.Vector3 = null;
  var server = std.net.StreamServer.init(.{});
  defer server.deinit();

  const SOCKET_PATH = "/tmp/libfive_mesh.sock";
  const socket_address = try std.net.Address.initUnix(SOCKET_PATH);
  defer std.fs.cwd().deleteFile(SOCKET_PATH) catch unreachable;

  try server.listen(socket_address);
  const sockfd = server.sockfd.?;
  const flags = fcntl.fcntl(sockfd, fcntl.F_GETFL);
  _ = fcntl.fcntl(sockfd, fcntl.F_SETFL, flags | fcntl.O_NONBLOCK);
  var connection_maybe: ?std.net.StreamServer.Connection = null;

  while (!ray.WindowShouldClose()) {
    if (state == .watch_start_magic_bytes) {
      ray.UpdateCamera(&camera, ray.CAMERA_ORBITAL);

      ray.BeginDrawing();
      ray.ClearBackground(ray.DARKBLUE);
      ray.BeginMode3D(camera);

      if (points_maybe) |points| {
          var index: u32 = 0;
          while (index < points_collected) : (index += 3) {
            ray.DrawTriangle3D(points[index + 0], points[index + 1], points[index + 2], ray.GRAY);
            ray.DrawLine3D(points[index + 0], points[index + 1], ray.WHITE);
            ray.DrawLine3D(points[index + 1], points[index + 2], ray.WHITE);
            ray.DrawLine3D(points[index + 2], points[index + 0], ray.WHITE);
          }
      }

      ray.EndMode3D();
      ray.EndDrawing();
    }

    blk: { switch(state) {
      .watch_start_magic_bytes => {
        var accepted_addr: std.net.Address = undefined;
        var adr_len: std.os.socklen_t = @sizeOf(std.net.Address);
        const accept_result = std.c.accept(server.sockfd.?, &accepted_addr.any, &adr_len);
        if (accept_result >= 0) {
          connection_maybe = std.net.StreamServer.Connection {
            .stream = std.net.Stream{ .handle = @intCast(accept_result) },
            .address = accepted_addr,
          };
        } else {
          break :blk;
        }
        _ = try connection_maybe.?.stream.reader().read(&buffers.magic_bytes);
        if (std.mem.eql(u8, &buffers.magic_bytes, &START_MAGIC_BYTES) == false) continue;
        std.debug.print("watch_start_magic_bytes -> read_total_points transition\n", .{});
        state = .read_total_points;
        points_collected = 0;
        _ = try connection_maybe.?.stream.write(&.{1});
      },
      .read_total_points => {
        std.debug.print("read_total_points trigger\n", .{ });
        _ = try connection_maybe.?.stream.reader().read(&buffers.total_points);
        const total_points = std.mem.bytesToValue(u32, &buffers.total_points);
        std.debug.print("points: {}\n", .{ total_points });
        points_maybe = try allocator.alloc(ray.Vector3, total_points);
        std.debug.print("read_total_points -> read_xyz_point transition\n", .{});
        state = .read_xyz_point;
        _ = try connection_maybe.?.stream.write(&.{2});
      },
      .read_xyz_point => {
        _ = try connection_maybe.?.stream.reader().read(&buffers.xyz_point);
        const ax = std.mem.bytesToValue(f32, buffers.xyz_point[0..4]);
        const ay = std.mem.bytesToValue(f32, buffers.xyz_point[4..8]);
        const az = std.mem.bytesToValue(f32, buffers.xyz_point[8..12]);
        points_maybe.?[points_collected] = .{ .x = ax, .y = ay, .z = az };
        points_collected += 1;
        const bx = std.mem.bytesToValue(f32, buffers.xyz_point[12..16]);
        const by = std.mem.bytesToValue(f32, buffers.xyz_point[16..20]);
        const bz = std.mem.bytesToValue(f32, buffers.xyz_point[20..24]);
        points_maybe.?[points_collected] = .{ .x = bx, .y = by, .z = bz };
        points_collected += 1;
        const cx = std.mem.bytesToValue(f32, buffers.xyz_point[24..28]);
        const cy = std.mem.bytesToValue(f32, buffers.xyz_point[28..32]);
        const cz = std.mem.bytesToValue(f32, buffers.xyz_point[32..36]);
        points_maybe.?[points_collected] = .{ .x = cx, .y = cy, .z = cz };
        points_collected += 1;

        if (points_collected != points_maybe.?.len) continue;

        state = .watch_start_magic_bytes;
        std.debug.print("read_xyz_point -> watch_start_magic_bytes transition\n", .{});
        _ = try connection_maybe.?.stream.write(&.{0});
        connection_maybe.?.stream.close();
      },
    } }
  }
}

