FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Reverse-Gantt.sln ./
COPY gantt_server/gantt_server.csproj gantt_server/
RUN dotnet restore gantt_server/gantt_server.csproj

COPY gantt_server/ gantt_server/
RUN dotnet publish gantt_server/gantt_server.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "gantt_server.dll"]
