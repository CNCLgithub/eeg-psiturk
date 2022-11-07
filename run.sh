#!/bin/bash

PSICONT="psiturk.sif"
CMD="$@"


usage="$(basename "$0") CMD -- pass a command to a psiturk server
supported targets:
    on : run psiturk
    off : stop psiturk
    restart
    status
    help
"

# print help
[ $# -eq 0 ]  && echo "$usage" && exit 0

# using this leads to zombie programs on the first try
# after that, only works for the ad page
# apptainer exec "$PSICONT" bash -c "cd psiturk && psiturk server ${CMD}"

# using this only puts you in the shell
# apptainer shell "$PSICONT"

# this only worked for the ad
# apptainer run "$PSICONT" bash -c "cd psiturk && psiturk server ${CMD}"