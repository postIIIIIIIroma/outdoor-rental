# Outdoor Rental — прокат спорядження

ASP.NET Core 8 (EF Core + PostgreSQL) + React/TypeScript/Tailwind в одному Docker-контейнері.

* Локально: `docker compose up --build` -> http://localhost:8080
* Render: New -> Blueprint -> обрати репозиторій (render.yaml все створить сам)
* Своя існуюча БД: змінна `DATABASE_URL=postgresql://user:pass@host:5432/db`
  або `ConnectionStrings:Default` в backend/appsettings.json

При старті, якщо таблиці `users` немає, автоматично виконується `backend/init.sql` (схема + дані з дампу).
