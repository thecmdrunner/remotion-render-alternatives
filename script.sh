###############
# CI Script
###############

sudo apt update
sudo apt-get install -y libnss3-dev gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

nvm install --lts
nvm use --lts

wget -qO- https://get.pnpm.io/install.sh | bash
curl -fsSL https://bun.sh/install | bash

UPTODATE_REPO=actually-uptodate-repo

git clone https://github.com/thecmdrunner/remotion-render-alternatives $UPTODATE_REPO
cd $UPTODATE_REPO

source ~/.bashrc

pnpm install --no-frozen-lockfile

mkdir out # so that it can write the inputProps.json without erroring out

pnpm run render-upload
