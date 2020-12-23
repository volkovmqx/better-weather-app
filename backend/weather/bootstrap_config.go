package weather

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// BoostrapConfig is a Bootstaper for the config variables of the project
type BoostrapConfig struct{}

// Endpoint return the URL to be used when searching for a city
func (c BoostrapConfig) Endpoint(query string) string {
	return fmt.Sprintf(goDotEnvVariable("API_ENDPOINT"), query, goDotEnvVariable("API_KEY"))
}

// MassEndpoint return the URL to be used to get multiple cities with a string of ids as a query
func (c BoostrapConfig) MassEndpoint(query string) string {
	return fmt.Sprintf(goDotEnvVariable("API_MASS_ENDPOINT"), query, goDotEnvVariable("API_KEY"))
}

// IconsBaseURL return the URL to be used as a base for icons
func (c BoostrapConfig) IconsBaseURL() string {
	return goDotEnvVariable("API_ICONS_URL")
}

func goDotEnvVariable(key string) string {

	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	return os.Getenv(key)
}
