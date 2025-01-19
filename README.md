# csv2ots

Un utilitaire web pour créer en masse des secrets [Onetime Secret](https://onetimesecret.com/) et les envoyer par email.

## Installation

### Docker Compose

Voici un exemple de fichier Compose pour déployer l'application :

```yaml
services:
  csv2ots:
    image: ghcr.io/djalexkidd/csv2ots:latest
    container_name: csv2ots
    restart: always
    environment:
      PORT: 3000
      OTS_HOST: "https://ots.change.me"
      OTS_USERNAME: "changeme@example.com"
      OTS_APIKEY: "12345678"
    ports:
      - "3000:3000"
```

Pour avoir un exemple avec Traefik : [docker-compose.yaml avec Traefik](https://github.com/djalexkidd/csv2ots/blob/master/docker-compose.yaml)

## Configuration

Cette application a besoin d'être configurée pour fonctionner. Remplissez les variables d'environnement dans ```.env``` ou dans Docker Compose.

```PORT``` : Port d'écoute du serveur. (Défaut: 3000)

```OTS_HOST``` : Adresse du serveur cible Onetime Secret.

```OTS_USERNAME``` : Nom d'utilisateur (adresse email).

```OTS_APIKEY``` : Clé d'API de l'utilisateur.

## Structure du fichier CSV

Chaque ligne contient un secret à envoyer au destinataire.

La première colonne est l'adresse email du destinataire, la seconde colonne est le secret à envoyer.

Par exemple, le fichier CSV quand ouvert dans un éditeur de texte, doit ressembler à ça :

```
john.doe@mailservice.com,1Vlw1f5Q
jacob@mailservice.com,hXtD13fl
```

Dans un tableur :

```
   [            A           ][    B   ]
[1][john.doe@mailservice.com][1Vlw1f5Q]
[2][  jacob@mailservice.com ][hXtD13fl]
```

## Limite d'envoi

Par défaut, Onetime Secret a une limite d'envoi de 50 emails par 20 minutes. Si votre CSV contient plus de 50 lignes, modifiez le fichier de configuration ```config.yaml``` dans OTS et augmentez la valeur de ```:email_recipient:```.