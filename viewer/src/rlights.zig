// Manual port of rlights.h to zig
// (https://github.com/raysan5/raylib/blob/master/examples/shaders/rlights.h).

const std = @import("std");
pub const raylib = @cImport(@cInclude("raylib.h"));

const MAX_LIGHTS = 4; // Max dynamic lights supported by shader

// Light type
pub const LightType = enum(i32) {
  directional,
  point,
};

// Light data
pub const Light = struct {   
  ty: LightType,
  enabled: i32 = 0,
  position: raylib.Vector3,
  target: raylib.Vector3,
  color: raylib.Color,
  // attenuation: f32,
    
  // Shader locations
  enabledLoc: i32 = -1,
  typeLoc: i32 = -1,
  positionLoc: i32 = -1,
  targetLoc: i32 = -1,
  colorLoc: i32 = -1,
  // attenuationLoc: i32,
};

var lightsCount: i32 = 0; // Current number of created lights.

// Create a light and get shader locations.
pub fn CreateLight(ty: LightType,
                   position: raylib.Vector3,
                   target: raylib.Vector3,
                   color: raylib.Color,
                   shader: raylib.Shader) ?Light {
  if (lightsCount < MAX_LIGHTS) {
    var light: Light = .{
      .ty = ty,
      .enabled = 1,
      .position = position,
      .target = target,
      .color = color,
    };

    // NOTE: Lighting shader naming must be the provided ones.
    light.enabledLoc =
      raylib.GetShaderLocation(shader, raylib.TextFormat("lights[%i].enabled", lightsCount));
    light.typeLoc =
      raylib.GetShaderLocation(shader, raylib.TextFormat("lights[%i].type", lightsCount));
    light.positionLoc =
      raylib.GetShaderLocation(shader, raylib.TextFormat("lights[%i].position", lightsCount));
    light.targetLoc =
      raylib.GetShaderLocation(shader, raylib.TextFormat("lights[%i].target", lightsCount));
    light.colorLoc =
      raylib.GetShaderLocation(shader, raylib.TextFormat("lights[%i].color", lightsCount));

    UpdateLightValues(shader, light);
        
    lightsCount += 1;
    
    return light;
  }
  else {
    return null;
  }
}

// Send light properties to shader.
// NOTE: Light shader locations should be available.
fn UpdateLightValues(shader: raylib.Shader, light: Light) void {
  // Send to shader light enabled state and type.
  raylib.SetShaderValue(shader, light.enabledLoc, &light.enabled, raylib.SHADER_UNIFORM_INT);
  raylib.SetShaderValue(shader, light.typeLoc, &@intFromEnum(light.ty), raylib.SHADER_UNIFORM_INT);

  // Send to shader light position values.
  raylib.SetShaderValue(shader, light.positionLoc, &light.position, raylib.SHADER_UNIFORM_VEC3);

  // Send to shader light target position values.
  raylib.SetShaderValue(shader, light.targetLoc, &light.target, raylib.SHADER_UNIFORM_VEC3);

  // Send to shader light color values.
  var color: raylib.Vector4 = .{.x = @as(f32, @floatFromInt(light.color.r))/255.0,
                                .y = @as(f32, @floatFromInt(light.color.g))/255.0, 
                                .z = @as(f32, @floatFromInt(light.color.b))/255.0,
                                .w = @as(f32, @floatFromInt(light.color.a))/255.0};
  raylib.SetShaderValue(shader, light.colorLoc, &color, raylib.SHADER_UNIFORM_VEC4);
}
