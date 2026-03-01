# 💰 Smart Budget Tracker

A feature‑rich, interactive web app to manage your personal finances. Track income/expenses, set monthly budgets, receive insights, and never miss a bill – all with a sleek dark mode and voice input!

[![GitHub license](https://img.shields.io/github/license/yourusername/budget-tracker)](LICENSE)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white)

---

## ✨ Features

- **Add transactions** – description, amount, type (income/expense), category, and optional recurring flag.
- **Real‑time summary** – total income, expenses, and balance instantly updated.
- **Monthly budget limits** – set custom limits per category (Food, Transport, etc.) and see progress bars.
- **Interactive pie chart** – expense breakdown for the current month (powered by Chart.js).
- **Smart insights** – get warnings when you approach or exceed budgets, and see spending trends.
- **Bill reminders** – automatically track upcoming recurring bills and highlight those due within 7 days.
- **Recurring transactions** – mark an expense as recurring; it will be auto‑added each month.
- **Voice input** – say things like *“add expense 200 for food lunch”* and the form fills itself!
- **Dark mode toggle** – switch between light and dark themes (preference saved in localStorage).
- **Export / Import CSV** – backup your data or bulk upload transactions.
- **Fully responsive** – works beautifully on desktop, tablet, and mobile.

---

## 🖼️ Screenshots

| Light Mode | Dark Mode |
|------------|-----------|
| ![Light mode screenshot](screenshots/light.png) | ![Dark mode screenshot](screenshots/dark.png) |

> *Add your own screenshots in a `screenshots/` folder.*

---

## 🛠️ Technologies Used

- **HTML5** – semantic structure
- **CSS3** – custom properties (variables), Flexbox, Grid, animations
- **JavaScript (ES6)** – all logic, DOM manipulation, localStorage
- **Chart.js** – beautiful, responsive charts
- **Font Awesome** – icons for buttons and categories
- **Web Speech API** – voice recognition for hands‑free input

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge, Safari) – voice input requires Chrome or Edge.
- No server needed; it's pure client‑side.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/budget-tracker.git
