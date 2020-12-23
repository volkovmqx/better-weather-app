package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/volkovmqx/weather-backend/weather"
)

func main() {

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	fc := weather.FavoriteController{}
	config := weather.BoostrapConfig{}
	db := weather.BootstrapDatabase("./")

	// Routes
	e.GET("/search/:query", func(c echo.Context) error {
		return fc.Search(c, config)
	})
	e.GET("/favorites", func(c echo.Context) error {
		return fc.ListFavorites(c, db)
	})
	e.GET("/favorite/:favorite", func(c echo.Context) error {
		return fc.GetFavorite(c, config, db)
	})
	e.POST("/favorites", func(c echo.Context) error {
		return fc.CreateFavorite(c, db)
	})
	e.PUT("/favorites", func(c echo.Context) error {
		return fc.UpdateFavorite(c, db)
	})
	e.DELETE("/favorites/:favorite", func(c echo.Context) error {
		return fc.DeleteFavorite(c, db)
	})

	// Start server
	e.Logger.Fatal(e.Start(":3000"))

}
