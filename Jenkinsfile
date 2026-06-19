pipeline {
    agent any

    // Aquí le decimos a Jenkins que use la herramienta que acabamos de configurar
    tools {
        nodejs 'Node' 
    }

    stages {
        stage('Verificar Entorno') {
            steps {
                echo 'Comprobando versiones de Node y NPM...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Instalar Dependencias') {
            steps {
                echo 'Instalando las librerías del proyecto...'
                // Usa 'npm ci' si prefieres instalaciones más exactas basadas en package-lock.json
                sh 'npm install'
            }
        }
        
        stage('Ejecutar Pruebas') {
            steps {
                echo 'Corriendo las pruebas de Jest...'
                // Este comando buscará el script "test" dentro de tu package.json
                sh 'npm run test'
            }
        }
    }
    
    // Opcional: Acciones a tomar cuando termine
    post {
        success {
            echo '¡Excelente! Todas las pruebas pasaron.'
        }
        failure {
            echo 'Oh no, alguna prueba falló. Revisa los logs.'
        }
    }
}