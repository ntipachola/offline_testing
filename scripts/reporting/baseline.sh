#!/bin/bash

source ~/.baseline_testing/scripts/check_db_exists.sh

#colors
#=======
export black=`tput setaf 0`
export red=`tput setaf 1`
export green=`tput setaf 2`
export yellow=`tput setaf 3`
export blue=`tput setaf 4`
export magenta=`tput setaf 5`
export cyan=`tput setaf 6`
export white=`tput setaf 7`

# reset to default bash text style
export reset=`tput sgr0`

# make actual text bold
export bold=`tput bold`

# make background color on text
export bold_mode=`tput smso`

# remove background color on text
export exit_bold_mode=`tput rmso`

# check if directories exist
DIRECTORIES=( ~/.reports/baseline )
for DIRECTORY in ${DIRECTORIES[@]}; do
  if [ ! -d "$DIRECTORY" ]; then
    mkdir "$DIRECTORY"
  else
    echo "${blue}Reports directory already exists. Skipping this step${reset}"
  fi
done

#pull latest changes from master branch in repo
cd ~/.baseline_testing
git reset --hard origin/zambia > /dev/null
git pull origin zambia > /dev/null

#check if database file exists before extracting reports
if db_exists $BASELINE_DATABASE_NAME ; then
  # Let the user know that the database already exists and skip
  echo "${blue}Database already exists.Skipping...${reset}"
  #if db file exists then extraction and submission begin. If not, will output error message to contact support
	if (echo $1 |\
    egrep '^(1[0-2]|0[0-9])[-/][0-9]{2}' > /dev/null
	); then
       echo "${green}Extracting baseline tests for month $1${reset}"
       # fetch the first argument given(the month_year) on the command line and use it as an argument to the Rscript
       Rscript ~/.baseline_testing/scripts/reporting/baseline.R "$1"
       # After Rscript executes, execute send report script
       chmod +x ~/.baseline_testing/scripts/reporting/send_baseline.sh
       ~/.baseline_testing/scripts/reporting/send_baseline.sh
   else 
       echo "${red}${bold}Please enter a valid year and month e.g 02-17${reset}"
       exit 1 
   fi
else
	echo "${red}${bold}Error. Baseline tests NOT extracted. Please contact tech support 1>&2"
	exit 1
fi