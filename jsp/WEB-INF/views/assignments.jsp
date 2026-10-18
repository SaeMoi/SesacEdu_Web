<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false" %>
<% // 실제 과제 데이터와 제출 권한은 추후 백엔드에서 전달합니다.
String pageTitle="과제 확인"; boolean openChat=false;
request.setAttribute("assignmentPage", true); %>
<%@ include file="../fragments/classroom.jspf" %>
