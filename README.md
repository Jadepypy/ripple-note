# Ripple Note
A true collaborative note taking app that supports multilevel file system, markdown editing and version control.

## Website 
[Link](https://ripple-note.com)

Test Account1:
* Email: demo1@mail.com
* Password: password

Test Account2:
* Email: demo2@mail.com
* Password: password

## Table of Contents
* [Feature](#Feature)
* [Technologies](#Technologies)

## Feature
### Collaborative Note Editing
* Supports collaboration on deletion/insertion/bulk deletion
* Supports copy (Command-C/ Ctl-C)/ paste (Command-V/ Ctl-V)/ cut (Command-X/ Ctl-X)
* Supports redo (Command-Z/ Ctl-Z)/ undo (Command-Y/ Ctl-Y)
* TODO: collaboration on Mandarin, realtime users' cursor display
### Vault -- An open sharing workspace
* Add user to vault
![add user](https://d16llsq1urfp7y.cloudfront.net/ripple-note/add_user.gif)
* Switch between vault
![switch vault](https://d16llsq1urfp7y.cloudfront.net/ripple-note/switch_vault.gif)
### File System
* Supports multilevel structure
![multilevel file systme](https://d16llsq1urfp7y.cloudfront.net/ripple-note/multilevel_file_system.gif)
* Real time update on file system management (drag/create/delete/rename)
![file system update](https://d16llsq1urfp7y.cloudfront.net/ripple-note/realtime_file_system.gif)
### Version Control
* Automatically keep track of document versions
![auto version control](https://d16llsq1urfp7y.cloudfront.net/ripple-note/auto_version_control.gif)
*  Restore specified version
![restored specified version](https://d16llsq1urfp7y.cloudfront.net/ripple-note/restore_specified_version.gif)

### Markdown Preview
* Change to preview mode
![markdown preview](https://d16llsq1urfp7y.cloudfront.net/ripple-note/markdown_preview.gif)


## Technologies
### Architecture
![architure](https://d16llsq1urfp7y.cloudfront.net/ripple-note/architecture.png)

### Backend
* Environment: Linux + **Node.js**
* Framework: **Express.js**
* Real-time Data Transport: **Socket.io**

### Front-End 
* HTML
* CSS
* JavaScript

### Operational transformation


### Database
* **RDS** + **MySQL**
* Schema: 
![database schema](https://d16llsq1urfp7y.cloudfront.net/ripple-note/database_schema.png)



### Networking
* Protocol: **HTTP & HTTPs**
* Reverse Proxy: **Nginx**

### Tools
* Test: **Mocha + Chai + Sinon**
* Code Formatter: **Prettier**

### AWS Cloud Services
* **EC2**
* **RDS**
