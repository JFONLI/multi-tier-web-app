# 3-Tier Web Server on AWS Elastic Beanstalk System

## Taks from web console
* Create a SNS topic: “club”, and subscribe it with your email 

## Tasks of a frontend web server
* Provides a signup page for users to enter: “name”, “email”, “gender”
* Store users’ information in a dynamoDB table
* Generate a message in the following Jason format, and send it to a SQS queue: {“name”:”xxx”, “email”,”xxx@xxx.xxx”,” gender”:”[F/M]”}
## Tasks of a backend worker
* Connect worker with the SQS queue, and let sqsd pull the message 
* Parse the http request generated from sqsd, and retrieve the user info
* Call SNS API to publish the following message to the topic “club”
“Let’s welcome our new member [Ms./Mr.] [Name]. His contact email is [email]. We now have the following members in the club: [list of member names].”

-------------------

## Programming Language

### Fronted Server : Go
### Backend Server : Node.js