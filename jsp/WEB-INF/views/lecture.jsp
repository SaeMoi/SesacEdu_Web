<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<%
  // /lectures/1/learn처럼 강의 ID가 포함된 학습 주소만 허용합니다.
  String learningPath = request.getRequestURI()
      .substring(request.getContextPath().length());

  java.util.regex.Matcher learningMatch =
      java.util.regex.Pattern
          .compile("^/lectures/([1-9][0-9]*)/learn$")
          .matcher(learningPath);

  if (!learningMatch.matches()) {
    response.sendError(404);
    return;
  }

  // 추후 수강 API 연동 시 사용할 강의 ID입니다.
  request.setAttribute("lectureId", learningMatch.group(1));

  String pageTitle = "강의 학습";
  boolean openChat = false;
%>
<%@ include file="../fragments/classroom.jspf" %>