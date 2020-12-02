package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	echo "github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	scribble "github.com/nanobox-io/golang-scribble"
	uuid "github.com/nu7hatch/gouuid"
)

type City struct {
	ID   int
	Name string
}
type Favorite struct {
	ID     string
	Name   string
	Cities []City
}

func goDotEnvVariable(key string) string {

	// load .env file
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	return os.Getenv(key)
}

func main() {

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	dir := "./"
	db, err := scribble.New(dir, nil)
	if err != nil {
		fmt.Println("Error", err)
	}

	// Handlers
	search := func(c echo.Context) error {
		query := c.Param("query")
		url := fmt.Sprintf("http://api.openweathermap.org/data/2.5/weather?units=metric&q=%s&appid=%s", query, goDotEnvVariable("APIKEY"))
		response, err := http.Get(url)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound)
		} else {
			body, _ := ioutil.ReadAll(response.Body)
			var weather map[string]interface{}
			if err := json.Unmarshal(body, &weather); err != nil {
				fmt.Println("Error", err)
			}
			fmt.Println("Error", weather)
			if weather["cod"] == "404" {
				return c.JSON(http.StatusOK, map[string]interface{}{})
			}
			return c.JSON(http.StatusOK, weather)
		}
	}

	listFavorites := func(c echo.Context) error {
		records, err := db.ReadAll("favorite")
		if err != nil {
			fmt.Println("Error", err)
		}
		favorites := []Favorite{}
		for _, f := range records {
			favoriteFound := Favorite{}
			if err := json.Unmarshal([]byte(f), &favoriteFound); err != nil {
				fmt.Println("Error", err)
			}
			favorites = append(favorites, favoriteFound)
		}
		return c.JSON(http.StatusOK, favorites)
	}

	getFavorite := func(c echo.Context) error {
		id := c.Param("favorite")

		favorite := Favorite{}
		if err := db.Read("favorite", id, &favorite); err != nil {
			return echo.NewHTTPError(http.StatusNotFound)
		}

		if len(favorite.Cities) == 0 {
			return c.JSON(http.StatusOK, map[string]interface{}{"favorite": favorite})
		}
		// get the id of all the cities in the favorite and prepare them for binding
		cityIDs := ""
		for _, c := range favorite.Cities {

			cityIDs += strconv.Itoa(c.ID) + ","
		}

		url := fmt.Sprintf("http://api.openweathermap.org/data/2.5/group?units=metric&id=%s&appid=%s", cityIDs, goDotEnvVariable("APIKEY"))
		response, err := http.Get(url)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound)
		}
		body, _ := ioutil.ReadAll(response.Body)
		var weather map[string]interface{}
		if err := json.Unmarshal(body, &weather); err != nil {
			fmt.Println("Error", err)
		}
		weather["favorite"] = favorite
		return c.JSON(http.StatusOK, weather)
	}

	createFavorite := func(c echo.Context) error {
		u, err := uuid.NewV4()
		f := new(Favorite)
		if err = c.Bind(f); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest)
		}
		// check if exists
		favoriteCheck := Favorite{}
		f.ID = u.String()
		if err := db.Read("favorite", f.ID, &favoriteCheck); err != nil {
			db.Write("favorite", f.ID, f)
			return c.JSON(http.StatusOK, map[string]string{"status": "added", "ID": f.ID})
		}
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	updateFavorite := func(c echo.Context) error {
		f := new(Favorite)
		if err = c.Bind(f); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest)
		}
		db.Write("favorite", f.ID, f)
		return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
	}

	deleteFavorite := func(c echo.Context) error {
		id := c.Param("favorite")
		if err := db.Delete("favorite", id); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest)
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})

	}

	// Routes
	e.GET("/search/:query", search)
	e.GET("/favorites", listFavorites)
	e.GET("/favorite/:favorite", getFavorite)
	e.POST("/favorites", createFavorite)
	e.PUT("/favorites", updateFavorite)
	e.DELETE("/favorites/:favorite", deleteFavorite)

	// Start server
	e.Logger.Fatal(e.Start(":3000"))

}
