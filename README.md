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
![collaboration](https://d16llsq1urfp7y.cloudfront.net/ripple-note/collaboration.gif)
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
![architure](https://d16llsq1urfp7y.cloudfront.net/ripple-note/architecture_altered.png)

### Backend
* Environment: Linux + **Node.js**
* Framework: **Express.js**
* Real-time Data Transport: **Socket.IO**

### Front-End 
* HTML
* CSS
* JavaScript
* Markdown Converter: [marked.js](https://marked.js.org)

### Operational transformation 
* Breaks down text editing behavior into two kinds of operation, insertion and deletion.
* Operational transformation is, in its simplest form, a transformation function that takes a pair of operations A and B and produces a new pair A' and B' such that applying A then B' or B then A' would both lead to the same document.

![ot funciton](https://d16llsq1urfp7y.cloudfront.net/ripple-note/ot_function.png)
* Requires a centralized server to globally order operations so that operational transformation would only take place between two parties, client and server.

![ot funciton](https://d16llsq1urfp7y.cloudfront.net/ripple-note/two_clients_ot.png)

![one client](https://d16llsq1urfp7y.cloudfront.net/ripple-note/one_client_ot.png)

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


