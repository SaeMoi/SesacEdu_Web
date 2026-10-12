"""JSP 원본, React 메인과 헤더 산출물을 별도 임시 Tomcat base로 복사합니다."""
from pathlib import Path
import shutil
import sys
import tempfile

source = Path(__file__).resolve().parent
repo = source.parent
runtime = Path(sys.argv[1]).resolve()
# 기존 설치나 작업 폴더를 덮어쓰지 않기 위해 실행마다 새 폴더를 만듭니다.
base = Path(tempfile.mkdtemp(prefix="sesac-jsp-preview-"))
for folder in ("conf", "logs", "temp", "work", "webapps/ROOT"):
    (base / folder).mkdir(parents=True, exist_ok=True)
for file in (runtime / "conf").iterdir():
    if file.is_file():
        shutil.copy2(file, base / "conf" / file.name)
webapp = base / "webapps/ROOT"
shutil.copytree(repo / "dist", webapp, dirs_exist_ok=True)
for folder in ("WEB-INF", "assets"):
    shutil.copytree(source / folder, webapp / folder, dirs_exist_ok=True)
(webapp / "ui").mkdir()
for file in ("header.js",):
    shutil.copy2(repo / "dist-header" / file, webapp / "ui" / file)
for file in ("chatbot.js", "chatbot.css"):
    shutil.copy2(repo / "dist-chatbot" / file, webapp / "ui" / file)
# 로컬에서만 접근 가능. 관리 앱이나 예제 앱은 배포하지 않습니다.
(base / "conf/server.xml").write_text('''<?xml version="1.0" encoding="UTF-8"?>
<Server port="-1"><Service name="Catalina">
<Connector address="127.0.0.1" port="8088" protocol="HTTP/1.1" URIEncoding="UTF-8" />
<Engine name="Catalina" defaultHost="localhost"><Host name="localhost" appBase="webapps" unpackWARs="false" autoDeploy="false" /></Engine>
</Service></Server>''', encoding="utf-8")
print(base)
