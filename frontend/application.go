package main

import (
	"log"
	"net/http"
	"os"
	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/sqs"
	"fmt"
	"encoding/json"
)

type Member struct {
	Name   string	`json:"name"`
	Email  string	`json:"email"`
	Gender string	`json:"gender"`
}

func CreateMemberToDynamodb(sess *session.Session, tableName string, name string, email string, gender string) {

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	member := Member{
		Name: name,
		Email: email,
		Gender: gender,
	}

	av, err := dynamodbattribute.MarshalMap(member)
	if err != nil {
		log.Fatalf("Got error marshalling new member item: %s", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      av,
		TableName: aws.String(tableName),
	}

	_, err = svc.PutItem(input)
	if err != nil {
		log.Fatalf("Got error calling PutItem: %s", err)
	}

	fmt.Println("Successfully added '" + member.Name + "to " + tableName)
}

func SendMessageToStandardSqs(sess *session.Session, queueURL *string, json string){
	svc := sqs.New(sess)

	result, err := svc.SendMessage(&sqs.SendMessageInput{
		MessageBody: aws.String(json),
		QueueUrl:    queueURL,
	})

	if err != nil {
		fmt.Println(err.Error())
	}

	fmt.Println("Successfully Push message to sqsd. ID: " + *result.MessageId)
}

func RunServer() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	// Initialize a session that the SDK will use to load
	// credentials from the shared credentials file ~/.aws/credentials
	// and region from the shared configuration file ~/.aws/config.

	// sess := session.Must(session.NewSessionWithOptions(session.Options{
	// 	SharedConfigState: session.SharedConfigEnable,
	// }))

	// Connect to the region
	sess, _ := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})

	//Get sqs url
	queue_url := os.Getenv("QUEUE_URL")
	
	//Get DynamoDB table name
	table_name := os.Getenv("TABLE_NAME")

	f, _ := os.Create("/var/log/golang/golang-server.log")
	defer f.Close()
	log.SetOutput(f)

	fmt.Println("Start Running")

	const indexPage = "public/index.html"
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		//Get input from html through POST

		if r.Method == "POST" {

			for key, value := range r.Form {
				fmt.Printf("%s = %s\n", key, value)
			}

			name := r.FormValue("name")
			email := r.FormValue("email")
			gender := r.FormValue("gender")

			go CreateMemberToDynamodb(sess, table_name, name, email, gender)

			member := Member{
				Name: name,
				Email: email,
				Gender: gender,
			}
			
			json, _ := json.Marshal(member)
			
			go SendMessageToStandardSqs(sess, aws.String(queue_url), string(json))
			fmt.Fprintf(w, "Success")

			
		} else {
			log.Printf("Serving %s to %s...\n", indexPage, r.RemoteAddr)
			http.ServeFile(w, r, indexPage)
		}
	})

	log.Printf("Listening on port %s\n\n", port)
	http.ListenAndServe(":"+port, nil)
	
}

func main() {
	RunServer()
}
