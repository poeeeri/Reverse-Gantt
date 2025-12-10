using gantt_server.Dtos.AuthDtos;
using gantt_server.Dtos.StudentDtos;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public sealed class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] AuthRegisterDto dto, CancellationToken ct)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    return BadRequest(new { errors });
                }

                var resp = await _authService.RegisterAsync(dto, ct);
                return Ok(resp);
            }
            catch (InvalidOperationException ex) 
            { 
                return Conflict(new { error = ex.Message }); 
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] AuthLoginDto dto, CancellationToken ct)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    return BadRequest(new { errors });
                }

                var resp = await _authService.LoginAsync(dto, ct);
                return Ok(resp);
            }
            catch (InvalidOperationException ex) 
            { 
                return Unauthorized(new { error = ex.Message }); 
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<StudentReadDto>> Me(
            [FromServices] IStudentService students,
            CancellationToken ct
        )
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!Guid.TryParse(sub, out var studentId))
                return Unauthorized();

            var dto = await students.GetMeAsync(studentId, ct);
            return dto is null ? NotFound() : Ok(dto);
        }
    }
}


// using gantt_server.Dtos.AuthDtos;
// using gantt_server.Dtos.StudentDtos;
// using gantt_server.Services.Interfaces;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using System.IdentityModel.Tokens.Jwt;

// namespace gantt_server.Controllers
// {
//     [ApiController]
//     [Route("api/auth")]
//     public sealed class AuthController : ControllerBase
//     {
//         private readonly IAuthService _authService;

//         public AuthController(IAuthService authService)
//         {
//             _authService = authService;
//         }

//         [HttpPost("register")]
//         public async Task<ActionResult<AuthResponseDto>> Register([FromBody] AuthRegisterDto dto, CancellationToken ct)
//         {
//             try
//             {
//                 var resp = await _authService.RegisterAsync(dto, ct);
//                 return Ok(resp);
//             }
//             catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
//         }

//         [HttpPost("login")]
//         public async Task<ActionResult<AuthResponseDto>> Login([FromBody] AuthLoginDto dto, CancellationToken ct)
//         {
//             try
//             {
//                 var resp = await _authService.LoginAsync(dto, ct);
//                 return Ok(resp);
//             }
//             catch (InvalidOperationException ex) { return Unauthorized(new { error = ex.Message }); }
//         }

//         [HttpGet("me")]
//         [Authorize]
//         public async Task<ActionResult<StudentReadDto>> Me(
//             [FromServices] IStudentService students,
//             CancellationToken ct
//         )
//         {
//             var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
//             if (!Guid.TryParse(sub, out var studentId))
//                 return Unauthorized();

//             var dto = await students.GetMeAsync(studentId, ct);
//             return dto is null ? NotFound() : Ok(dto);
//         }
//     }
// }
