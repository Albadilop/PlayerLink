# WebApp boilerplate with React JS and Flask API

Build web applications using React.js for the front end and python/flask for your backend API.

- Documentation can be found here: https://4geeks.com/docs/start/react-flask-template
- Here is a video on [how to use this template](https://www.loom.com/share/f37c6838b3f1496c95111e515e83dd9b)
- Integrated with Pipenv for package managing.
- Fast deployment to Render [in just a few steps here](https://4geeks.com/docs/start/deploy-to-render-com).
- Use of .env file.
- SQLAlchemy integration for database abstraction.

### 1) Installation:

> If you use Github Codespaces (recommended) or Gitpod this template will already come with Python, Node and the Posgres Database installed. If you are working locally make sure to install Python 3.10, Node 

It is recomended to install the backend first, make sure you have Python 3.10, Pipenv and a database engine (Posgress recomended)

1. Install the python packages: `$ pipenv install`
2. Create a .env file based on the .env.example: `$ cp .env.example .env`
3. Install your database engine and create your database, depending on your database you have to create a DATABASE_URL variable with one of the possible values, make sure you replace the valudes with your database information:

| Engine    | DATABASE_URL                                        |
| --------- | --------------------------------------------------- |
| SQLite    | sqlite:////test.db                                  |
| MySQL     | mysql://username:password@localhost:port/example    |
| Postgress | postgres://username:password@localhost:5432/example |

4. Migrate the migrations: `$ pipenv run migrate` (skip if you have not made changes to the models on the `./src/api/models.py`)
5. Run the migrations: `$ pipenv run upgrade`
6. Run the application: `$ pipenv run start`

> Note: Codespaces users can connect to psql by typing: `psql -h localhost -U gitpod example`

### Undo a migration

You are also able to undo a migration by running

```sh
$ pipenv run downgrade
```

### Backend Populate Table Users

To insert test users in the database execute the following command:

```sh
$ flask insert-test-users 5
```

And you will see the following message:

```
  Creating test users
  test_user1@test.com created.
  test_user2@test.com created.
  test_user3@test.com created.
  test_user4@test.com created.
  test_user5@test.com created.
  Users created successfully!
```

### **Important note for the database and the data inside it**

Every Github codespace environment will have **its own database**, so if you're working with more people eveyone will have a different database and different records inside it. This data **will be lost**, so don't spend too much time manually creating records for testing, instead, you can automate adding records to your database by editing ```commands.py``` file inside ```/src/api``` folder. Edit line 32 function ```insert_test_data``` to insert the data according to your model (use the function ```insert_test_users``` above as an example). Then, all you need to do is run ```pipenv run insert-test-data```.

### Front-End Manual Installation:

-   Make sure you are using node version 20 and that you have already successfully installed and runned the backend.

1. Install the packages: `$ npm install`
2. Start coding! start the webpack dev server `$ npm run start`

## Starting the Application

### Starting the Backend

To start the Flask backend server, you have several options:

**Option 1: Using Pipenv (Recommended)**
```bash
$ pipenv run start
```

**Option 2: Using Python directly**
```bash
$ cd src
$ python app.py
```

**Option 3: Using Flask CLI**
```bash
$ cd src
$ export FLASK_APP=app.py
$ export FLASK_DEBUG=1
$ export PORT=3001
$ python app.py
```

The backend will start on `http://localhost:3001`

### Starting the Frontend

To start the React frontend development server:

```bash
$ npm run dev
```

or

```bash
$ npm run start
```

The frontend will start on `http://localhost:5173`

### Running Both Services

You need to run both services in separate terminal windows/tabs:

**Terminal 1 - Backend:**
```bash
$ cd src
$ python app.py
```

**Terminal 2 - Frontend:**
```bash
$ npm run dev
```

> **Note:** Make sure the backend is running before starting the frontend, as the frontend needs to connect to the backend API.

## Seguridad

Esta aplicación incluye mejoras de seguridad implementadas para proteger contra vulnerabilidades comunes. Para más detalles, consulta:

- **[Mejoras de Seguridad Implementadas](docs/SECURITY_IMPROVEMENTS.md)** - Documentación completa de todas las mejoras
- **[Changelog de Seguridad](CHANGELOG_SECURITY.md)** - Resumen de cambios de seguridad

### Configuración de Seguridad Requerida

Asegúrate de configurar las siguientes variables de entorno en tu archivo `.env`:

```env
# OBLIGATORIO - Clave secreta para JWT (debe ser una cadena larga y aleatoria)
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria_aqui

# OBLIGATORIO - URL de conexión a la base de datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# OPCIONAL - Orígenes permitidos para CORS (separados por comas)
# En producción, configura con tus dominios reales
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# OPCIONAL - Activar debug mode (solo en desarrollo, NUNCA en producción)
FLASK_DEBUG=1
```

### Características de Seguridad Implementadas

- ✅ Almacenamiento seguro de contraseñas (hashing)
- ✅ Autenticación JWT con expiración
- ✅ Prevención de IDOR (Insecure Direct Object Reference)
- ✅ Rate limiting para prevenir ataques de fuerza bruta
- ✅ Validación robusta de entrada
- ✅ CORS configurado con orígenes específicos
- ✅ Manejo seguro de errores
- ✅ Prevención de email enumeration

## Publish your website!

This boilerplate it's 100% read to deploy with Render.com and Heroku in a matter of minutes. Please read the [official documentation about it](https://4geeks.com/docs/start/deploy-to-render-com).

### Contributors

This template was built as part of the 4Geeks Academy [Coding Bootcamp](https://4geeksacademy.com/us/coding-bootcamp) by [Alejandro Sanchez](https://twitter.com/alesanchezr) and many other contributors. Find out more about our [Full Stack Developer Course](https://4geeksacademy.com/us/coding-bootcamps/part-time-full-stack-developer), and [Data Science Bootcamp](https://4geeksacademy.com/us/coding-bootcamps/datascience-machine-learning).

You can find other templates and resources like this at the [school github page](https://github.com/4geeksacademy/).
