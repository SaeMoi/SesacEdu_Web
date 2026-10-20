# 프로젝트 전용 JSP 미리보기 (Windows PowerShell 버전). start-preview.sh 와 같은 일을 한다.
# 실행: powershell -ExecutionPolicy Bypass -File jsp\start-preview.ps1
$ErrorActionPreference = "Stop"

if (-not $env:JAVA_HOME)     { throw "JAVA_HOME에 Java 런타임 경로를 지정해 주세요." }
if (-not $env:CATALINA_HOME) { throw "CATALINA_HOME에 Tomcat 10.1 경로를 지정해 주세요." }
if (-not (Test-Path "$env:CATALINA_HOME\bin\catalina.bat")) {
    throw "CATALINA_HOME 아래에 bin\catalina.bat 이 없습니다: $env:CATALINA_HOME"
}

# 이 창의 PATH 가 비어 있어도 동작하도록 저장된 PATH 를 다시 읽는다.
# npm 과 catalina.bat 은 cmd.exe(System32)가 필요하고, npm 은 Node 설치 폴더에 있다.
$env:Path = @(
    "$env:SystemRoot\System32", $env:SystemRoot,
    [Environment]::GetEnvironmentVariable("Path", "Machine"),
    [Environment]::GetEnvironmentVariable("Path", "User"),
    "$env:ProgramFiles\nodejs", $env:Path
) -join ";"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm 을 찾을 수 없습니다. Node.js 를 설치해 주세요." }

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# 다른 프로세스가 쓰는 포트라면 중지한다. 기존 서버를 종료하지 않는다.
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8088)
try { $listener.Start() } catch { throw "8088 포트를 이미 다른 프로그램이 쓰고 있습니다." } finally { $listener.Stop() }

Set-Location $ProjectRoot
foreach ($script in "build", "build:header", "build:chatbot") {
    npm run $script
    if ($LASTEXITCODE -ne 0) { throw "npm run $script 실패" }
}

$python = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
$base = & $python "jsp\prepare-preview.py" $env:CATALINA_HOME | Select-Object -Last 1
if ($LASTEXITCODE -ne 0 -or -not $base) { throw "prepare-preview.py 실패 (위의 Python 오류를 확인하세요)" }
$env:CATALINA_BASE = $base.Trim()

Write-Host "JSP preview: http://127.0.0.1:8088/"
Write-Host "Runtime base: $env:CATALINA_BASE"
Write-Host "Stop: Ctrl+C"
& "$env:CATALINA_HOME\bin\catalina.bat" run
