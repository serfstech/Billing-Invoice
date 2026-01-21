# Billing-Invoice

📦 Billing-Invoice – How to Run the Project (Simple Explanation)

This is a desktop application built using:

Electron → desktop window

Node.js → backend logic

MySQL → database

The application runs successfully, but some modules are placeholders (under development). 

🧑‍💻 Requirements (Must Install First)

Node.js (LTS version)
Download from: https://nodejs.org

MySQL Server + MySQL Workbench

Git (optional, for cloning repo) 

📁 Project Setup (Step by Step)
1️⃣ Clone or Download the Project 

git clone <repository-url>
cd billing-invoice

OR download ZIP and extract it.


2️⃣ Install Dependencies

Open the project folder in VS Code
Open Terminal and run:

npm install

This creates the node_modules folder automatically.

3️⃣ Create Database

Open MySQL Workbench and run:

CREATE DATABASE Billing-Invoice;
USE Billing-Invoice;

Then import the provided SQL file:

Open Server → Data Import

Select data.sql

Choose database Billing-Invoice

Click Start Import

4️⃣ Configure Database Connection

Open:

database/config.js

Update credentials if needed:

host: "localhost",
user: "root",
password: "",
database: "Billing-Invoice",
port: 3306

5️⃣ Run the Application

In VS Code terminal:

npm start


This will:

Start the backend

Connect to MySQL

Open the Electron desktop app

🖥️ Application Status (Important)

✅ App launches successfully

✅ Dashboard works

✅ Database connects properly

⚠️ Note:
Modules like Suppliers, Customers, Products, Sales currently display
“Module under development”.

This is expected — those parts are UI placeholders and not fully implemented yet.


🧠 Project Purpose

This project demonstrates:

Electron desktop app structure

Node.js + MySQL integration

Modular UI design

It is suitable as:

Academic project

Starter template

Base for further development


❗ Notes for Reviewers

node_modules is intentionally excluded

Database schema is pre-defined

Some advanced SQL features are not auto-executed on startup

Future work includes full CRUD modules


✅ How to Stop the App

Close the desktop window
OR press Ctrl + C in terminal















