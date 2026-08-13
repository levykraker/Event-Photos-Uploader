# Event Photos Uploader

A lightweight, self-hosted application for collecting and sharing photos from events such as birthdays, weddings, parties, and other celebrations.

The application provides a simple web interface where guests can upload photos from their phones or computers. Uploaded photos are stored directly on the server hosting the application and can later be downloaded through the UI.

## Features

- 📸 Upload photos through a simple web UI
- 📥 Download uploaded photos through the UI
- 💾 Store photos in a configurable location on the host server
- 🔗 Share the application's URL with event guests
- 🏠 Fully self-hosted — photos remain on your own server
- ⚛️ Simple frontend built with Vite and React
- 🚀 Backend built with Express
- 🎉 Designed for events such as weddings, birthdays, parties, and family gatherings
- 📄 Released under the MIT License

## How It Works

The application consists of two main parts:

### Frontend

The frontend is a lightweight React application built using Vite. It provides the user interface for:

- Selecting and uploading photos
- Viewing available photos
- Downloading photos

### Backend

The backend is built with Express and is responsible for:

- Receiving uploaded files
- Saving files to the configured directory on the server
- Providing access to stored photos
- Handling photo downloads

Uploaded files are stored on the filesystem of the machine running the application.

## Typical Use Case

The application is designed to make it easy for guests at an event to share their photos.

For example, for a wedding:

1. The application is deployed on a server controlled by the organizer.
2. The organizer configures the directory where photos should be stored.
3. The application is made available through a URL.
4. The URL is shared with wedding guests.
5. Guests open the URL on their phones and upload their photos.
6. The photos are stored on the organizer's server.
7. Guests or organizers can download the collected photos through the application.

The same workflow can be used for birthdays, parties, corporate events, festivals, family gatherings, or any other event where multiple people need to share photos.

## Self-Hosting

This application is designed to be self-hosted.

You are responsible for providing and maintaining the environment in which the application runs, including:

- The server or hosting infrastructure
- Network configuration
- Domain and DNS configuration, if applicable
- HTTPS/TLS configuration
- Firewall configuration
- Authentication and access control, if required
- Server and operating system security
- File permissions
- Backups
- Storage capacity
- Monitoring and maintenance

### Important Security Notice

**The application does not provide or guarantee the security of your self-hosted deployment.**

Once the application is deployed, the security of the server and the way the application is exposed to the Internet are entirely the responsibility of the person operating the deployment.

In particular, the application does not take responsibility for:

- Securing the server
- Configuring HTTPS
- Protecting the application from unauthorized access
- Configuring firewalls or reverse proxies
- Protecting uploaded files from unauthorized access
- Preventing malicious uploads
- Managing user authentication or authorization
- Protecting the host filesystem
- Backing up uploaded photos
- Protecting the availability or integrity of stored data

If you make the application publicly accessible, you should take appropriate security measures before sharing the URL with other people.

## Storage

Photos are stored directly on the filesystem of the server running the application.

The storage location should therefore have sufficient free disk space for the expected number and size of uploaded photos.

Because the files are stored locally, **you are responsible for backups** if the photos are important.

Deleting or losing the application's storage directory may result in permanent loss of uploaded photos.

## Privacy

The application is designed for self-hosting, meaning that uploaded photos can remain entirely within infrastructure controlled by the operator.

However, privacy depends on how the application is deployed and secured. The application itself does not guarantee that uploaded photos are private or inaccessible to unauthorized users.

The operator is responsible for configuring the deployment appropriately for their use case and for complying with any applicable privacy and data protection requirements.

## Technology Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Storage:** Local filesystem

The architecture is intentionally simple, making the application suitable for running on a personal server, VPS, home server, or other self-hosted infrastructure.

## License

This project is licensed under the **MIT License**.

You are free to use, modify, distribute, and self-host the application in accordance with the terms of the license.

See the `LICENSE` file for the complete license text.

## Disclaimer

This software is provided **as is**, without warranty of any kind.

The authors and contributors are not responsible for any data loss, security incidents, unauthorized access, privacy violations, server compromise, or other damage resulting from the use, deployment, or misconfiguration of the application.

**You are solely responsible for your self-hosted instance, its security, its availability, and the data stored on it.**
