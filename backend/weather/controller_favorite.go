package weather

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"

	echo "github.com/labstack/echo/v4"
	uuid "github.com/nu7hatch/gouuid"
)

// FavoriteController is Controller that handles operations on favorites
type FavoriteController struct {
}

// Search is used to look for a city using a query parameter
func (fc *FavoriteController) Search(c echo.Context, config BoostrapConfig) error {

	query := c.Param("query")
	url := config.Endpoint(query)
	response, err := http.Get(url)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound)
	}
	body, _ := ioutil.ReadAll(response.Body)
	var weather map[string]interface{}
	if err := json.Unmarshal(body, &weather); err != nil {
		fmt.Println("Error", err)
	}
	fmt.Println("Error", weather)
	if weather["cod"] == "404" {
		return c.JSON(http.StatusOK, map[string]interface{}{})
	}
	weather["icons_base_url"] = config.IconsBaseURL()
	return c.JSON(http.StatusOK, weather)
}

// ListFavorites is used List all the available favorites
func (fc *FavoriteController) ListFavorites(c echo.Context, db Database) error {
	records, err := db.d.ReadAll("favorite")
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

// GetFavorite is used get a single favorite
// also the weather of all the cities inside the favorite
func (fc *FavoriteController) GetFavorite(c echo.Context, config BoostrapConfig, db Database) error {
	id := c.Param("favorite")

	favorite := Favorite{}
	if err := db.d.Read("favorite", id, &favorite); err != nil {
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

	url := config.MassEndpoint(cityIDs)
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
	weather["icons_base_url"] = config.IconsBaseURL()
	return c.JSON(http.StatusOK, weather)
}

// CreateFavorite create a new favorite and save it
func (fc *FavoriteController) CreateFavorite(c echo.Context, db Database) error {
	u, err := uuid.NewV4()
	f := new(Favorite)
	if err = c.Bind(f); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	// check if exists
	favoriteCheck := Favorite{}
	f.ID = u.String()
	if err := db.d.Read("favorite", f.ID, &favoriteCheck); err != nil {
		db.d.Write("favorite", f.ID, f)
		return c.JSON(http.StatusOK, map[string]string{"status": "added", "ID": f.ID})
	}
	return echo.NewHTTPError(http.StatusBadRequest)
}

// UpdateFavorite update the content of one specific favorite
func (fc *FavoriteController) UpdateFavorite(c echo.Context, db Database) error {
	f := new(Favorite)
	if err := c.Bind(f); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	db.d.Write("favorite", f.ID, f)
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

// DeleteFavorite deletes one specific favorite
func (fc *FavoriteController) DeleteFavorite(c echo.Context, db Database) error {
	id := c.Param("favorite")
	if err := db.d.Delete("favorite", id); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})

}
