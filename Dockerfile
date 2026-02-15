FROM node:20-alpine


RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone
ENV TZ=Asia/Seoul

# Create app directory
RUN mkdir -p /worker

RUN mkdir -p /worker/logs
 
# Set the /usr/src/app directory to WORKDIR
WORKDIR /app
 
# Copying all the files from your file system to container file system
COPY . .

# oracle install
RUN apk add --no-cache \
    bash \
    libaio \
    libc6-compat \
    libaio-dev \
    rpm \
    && rm -rf /var/cache/apk/*

RUN rpm -i --nodeps oracle-instantclient-basic-21.4.0.0.0-1.x86_64.rpm
ENV LD_LIBRARY_PATH="/usr/lib/oracle/21/client64/lib:/usr/lib/oracle/instantclient"
 
# Install all dependencies
RUN npm install
RUN npm fund
 
# Command to run app when intantiate an image
CMD ["node","./app/main.js"]
