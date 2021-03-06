#!/bin/bash

# get config vars
#colors
#=======
export red=`tput setaf 1`
export green=`tput setaf 2`
export yellow=`tput setaf 3`
export blue=`tput setaf 4`

# reset to default bash text style
export reset=`tput sgr0`

# make actual text bold
export bold=`tput bold`

# check if device is online or offline
timeout 10 wget -q --spider http://google.com

if [[ $? -eq 0 ]]; then
    #statements
    echo "${green}Device is Online${reset}"
    echo "Fetching details for Literacy learners...."
    # if device is online, download file from server with literacy learners then add to db on local server
    sshpass -p $SSHPASS rsync --progress -e ssh edulution@130.211.93.74:/home/edulution/baseline/literacy_learners ~/.baseline_testing/
    
    # Add literacy users to database
    Rscript ~/.baseline_testing/scripts/insert_literacy_users_into_baseline.R $literacy_users_file

    if [ "$?" = "0" ]; then
        echo "${green}Adding details for literacy learners...${reset}"
        echo "${green}${bold}Done!${reset}"
    else
        echo "${red}There was a problem fetching details for literacy learners. Please check your internet connection or try again${reset}"
    fi
else
    echo "${yellow}Device is Offline"
    echo "Could not fetch details for Literacy learners"
    echo "Please check your internet connection and try again. If the problem persists, contact support ${reset}"
fi