package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/company/hrms-backend/internal/attendance"
	"github.com/company/hrms-backend/internal/employee"
	"github.com/company/hrms-backend/internal/leave"
	"github.com/company/hrms-backend/internal/lifecycle"
	"github.com/company/hrms-backend/internal/organization"
	"github.com/company/hrms-backend/internal/payroll"
	"github.com/company/hrms-backend/internal/recruitment"
	"github.com/company/hrms-backend/internal/reports"
	"github.com/company/hrms-backend/internal/workflow"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found or error loading, relying on environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Mock DB dependency for sprint 2/3/4/5/6/8/9/10
	var db *pgxpool.Pool

	orgService := organization.NewService(db)
	empService := employee.NewService(db)
	wfService := workflow.NewService(db)
	leaveService := leave.NewService(db)
	attService := attendance.NewService(db)
	payrollService := payroll.NewService(db)
	recruitService := recruitment.NewService(db)
	lifecycleService := lifecycle.NewService(db)
	reportsService := reports.NewService(db)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", os.Getenv("FRONTEND_URL")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("pong"))
		})

		r.Route("/organization", func(r chi.Router) {
			orgService.RegisterRoutes(r)
		})

		r.Route("/employees", func(r chi.Router) {
			empService.RegisterRoutes(r)
		})

		r.Route("/workflows", func(r chi.Router) {
			wfService.RegisterRoutes(r)
		})

		r.Route("/leave", func(r chi.Router) {
			leaveService.RegisterRoutes(r)
		})

		r.Route("/attendance", func(r chi.Router) {
			attService.RegisterRoutes(r)
		})

		r.Route("/payroll", func(r chi.Router) {
			payrollService.RegisterRoutes(r)
		})

		r.Route("/recruitment", func(r chi.Router) {
			recruitService.RegisterRoutes(r)
		})

		r.Route("/lifecycle", func(r chi.Router) {
			lifecycleService.RegisterRoutes(r)
		})

		r.Route("/reports", func(r chi.Router) {
			reportsService.RegisterRoutes(r)
		})
	})

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: r,
	}

	go func() {
		log.Printf("Starting server on port %s...", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	log.Println("Server exiting")
}
