pipeline {
    agent {
        docker {
            image 'node:16.13.1-alpine' 
            args '-p 3000:80' 
        }
    }
    stages {
        stage('Build') { 
            steps {
                sh 'npm install' 
            }
        }
    }
}