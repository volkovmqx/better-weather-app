package weather

import (
	"fmt"

	scribble "github.com/nanobox-io/golang-scribble"
)

// Database is a wrapper of a database driver
type Database struct {
	d *scribble.Driver
}

// BootstrapDatabase bootstaps a database instance
func BootstrapDatabase(dir string) Database {
	db, err := scribble.New(dir, nil)
	if err != nil {
		fmt.Println("Error", err)
	}
	return Database{db}
}
