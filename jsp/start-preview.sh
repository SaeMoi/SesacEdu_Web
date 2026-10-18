#!/usr/bin/env bash
# 프로젝트 전용 JSP 미리보기. 기존 React 개발 서버와 별도 포트를 사용합니다.
set -euo pipefail
: "${JAVA_HOME:?JAVA_HOME에 Java 런타임 경로를 지정해 주세요.}"
: "${CATALINA_HOME:?CATALINA_HOME에 Tomcat 10.1 경로를 지정해 주세요.}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# 다른 프로세스가 쓰는 포트라면 중지합니다. 기존 서버를 종료하지 않습니다.
python3 - <<'CHECK'
import socket
with socket.socket() as server:
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", 8088))
CHECK
cd "$PROJECT_ROOT"
npm run build
npm run build:header
npm run build:chatbot
CATALINA_BASE="$(python3 jsp/prepare-preview.py "$CATALINA_HOME")"
export JAVA_HOME CATALINA_HOME CATALINA_BASE
printf 'JSP preview: http://127.0.0.1:8088/\nRuntime base: %s\nStop: Ctrl+C\n' "$CATALINA_BASE"
exec bash "$CATALINA_HOME/bin/catalina.sh" run
