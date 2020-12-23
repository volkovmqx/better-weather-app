FROM golang:1.15.5

WORKDIR /go/src/github.com/volkovmqx/weather-backend

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

CMD ["/go/src/github.com/volkovmqx/weather-backend/app"]