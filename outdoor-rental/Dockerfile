# ---------- 1. Збірка фронтенду ----------
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- 2. Збірка бекенду ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/RentalApi.csproj ./
RUN dotnet restore
COPY backend/ ./
RUN dotnet publish -c Release -o /app

# ---------- 3. Фінальний образ ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app ./
COPY --from=web /web/dist ./wwwroot
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RentalApi.dll"]
