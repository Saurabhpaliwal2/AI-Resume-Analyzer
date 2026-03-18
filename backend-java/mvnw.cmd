@REM Maven Wrapper for Windows
@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __ MVNW_CMD__=%MAVEN_WRAPPER_JAR%
@IF NOT "%MAVEN_WRAPPER_JAR%"=="" goto init

@SET MAVEN_WRAPPER_JAR=%userprofile%\.m2\wrapper\dists\apache-maven-3.9.6-bin\apache-maven-3.9.6\bin\mvn.cmd
@IF exist "%MAVEN_WRAPPER_JAR%" goto init

@SET DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
@SET MAVEN_HOME=%userprofile%\.m2\wrapper\dists\apache-maven-3.9.6-bin
@IF NOT exist "%MAVEN_HOME%" mkdir "%MAVEN_HOME%"

@WHERE curl >nul 2>&1
@IF %ERRORLEVEL% EQU 0 (
  curl -o "%MAVEN_HOME%\apache-maven-3.9.6-bin.zip" "%DOWNLOAD_URL%"
) ELSE (
  powershell -command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%MAVEN_HOME%\apache-maven-3.9.6-bin.zip'"
)
powershell -command "Expand-Archive -Path '%MAVEN_HOME%\apache-maven-3.9.6-bin.zip' -DestinationPath '%MAVEN_HOME%' -Force"

:init
SET MAVEN_WRAPPER_JAR=%userprofile%\.m2\wrapper\dists\apache-maven-3.9.6-bin\apache-maven-3.9.6\bin\mvn.cmd
@CALL "%MAVEN_WRAPPER_JAR%" %*
