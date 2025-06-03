# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2d12d04c-92c8-4ba4-ab38-df6fc695516d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2d12d04c-92c8-4ba4-ab38-df6fc695516d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2d12d04c-92c8-4ba4-ab38-df6fc695516d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)


### Deploy to VPS
If you want to deploy this project to your own VPS, you can follow these steps:
1. **Build the project**:
   ```sh
   npm run build
   ```
2. **Copy the `dist` folder to your VPS**:
   You can use `scp` or any other file transfer method to copy the `dist` folder to your VPS.
   ```sh
    scp -r ~/Documents/customer_success/geo-wander-guide/dist/* root@103.6.235.215:/var/www/maps.vietmap.us
   ```
3. **Reload nginx**:
    After copying the files, make sure to reload or restart your web server (e.g., Nginx or Apache) to serve the new files.
    ```sh
    sudo systemctl reload nginx
    ```

## Docker
`docker build --platform linux/amd64 -t vmlivemap .`

`docker save -o vmlivemap.tar vmlivemap:latest`

`scp vmlivemap.tar root@103.6.235.215:/root/`


## VPS

`docker stop vmlivemap-container`

`docker rm vmlivemap-container`

`docker image prune -a`

`docker load -i vmlivemap.tar`

`docker run -d --name vmlivemap-container --restart=always -p 5665:5005 vmlivemap:latest`


Reload nginx

```bash
sudo nginx -t
sudo systemctl reload nginx

```