## Migrating the Dashboard into an Existing Repository

This guide walks you through adding the CTAHR Dashboard as a subfolder inside your organization's existing GitHub repository.

---

## Prerequisites

Install the following before starting:

| Tool | Why you need it | Download |
|---|---|---|
| **Git** | To copy and manage the code | https://git-scm.com/downloads |
| **Node.js** (v18+) | To run the web app | https://nodejs.org/ |
| **Python 3** (v3.9+) | To run the data pipeline when updating data | https://www.python.org/downloads/ |

To verify everything is installed, open a terminal and run:
```bash
git --version
node --version
python3 --version
```

---

## Step 1 — Clone Your Existing Repository

Start by cloning the repo you want to add the dashboard into:

```bash
git clone https://github.com/your-org/your-existing-repo.git
cd your-existing-repo
```

> **Already have it cloned locally?** Just `cd` into it and make sure it's up to date:
> ```bash
> git pull origin main
> ```

---

## Step 2 — Get the Dashboard Code

```bash
git clone https://github.com/CTAHR-Dashboard/CTAHR-Dashboard.git ctahr-temp
```

---

## Step 3 — Copy the Dashboard into Your Repo

Copy the `capstone-dashboard` folder (and any other files you need, like `data-pipeline/`) into your existing repo. Replace `your-existing-repo` with your actual folder name:

```bash
# Copy the Next.js app
cp -r ctahr-temp/capstone-dashboard your-existing-repo/ctahr-dashboard

# Optional: copy the data pipeline scripts
cp -r ctahr-temp/data-pipeline your-existing-repo/ctahr-dashboard/data-pipeline
```

Your repo structure should now look something like:

```
your-existing-repo/
├── your-existing-files/
├── ctahr-dashboard/          ← dashboard lives here
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── ...
```

> **Rename the folder** to whatever fits your project structure — just keep the path consistent in the steps below.

---

## Step 4 — Install Dependencies

```bash
cd your-existing-repo/ctahr-dashboard
npm install
```

This downloads all the web app libraries into `node_modules/`. It may take a minute.

---

## Step 5 — Verify the App Runs

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. You should see the dashboard. Press `Ctrl+C` to stop it.

---

## Step 6 — Commit the Dashboard to Your Repository

```bash
# Go back to the root of your repo
cd ../..

# Stage the new dashboard folder
git add ctahr-dashboard/

# Commit
git commit -m "Add CTAHR Dashboard"

# Push to your existing repo
git push origin main
```

> **Note:** If your default branch is called `master` instead of `main`, replace `main` with `master` in the last command.

---

## Step 7 — Clean Up the Temporary Clone (Option A only)

If you cloned the dashboard in Step 2, you can delete the temp folder now:

```bash
# Run this from outside both repos
rm -rf ctahr-temp
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Make sure Node.js v18+ is installed: `node --version` |
| `npm run dev` shows port already in use | Another app is using port 3000 — Next.js will automatically switch to 3001 |
| `python3 pipeline.py` fails with import errors | Install required packages: `pip3 install pandas geopandas` |
| `git push` is rejected | Pull the latest changes first: `git pull origin main --rebase`, then push again |
| Files conflict with existing repo files | Move the dashboard folder to a different subfolder path and update the `cd` paths in steps above |
