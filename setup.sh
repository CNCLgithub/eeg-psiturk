#!/bin/bash

# Download links
CONTLINK="docker://cpllab/psiturk:latest"
# Path to put data
DATAPATH="psiturk/static/"
LINKHASH="4u6kvx68wbg6tx3fmonrcphueprsy2j6"
DATALINK="https://yale.box.com/shared/static/${LINKHASH}.gz"
ENVNAME="eeg-psiturk-env"


usage="$(basename "$0") [targets...] -- setup an environmental components of project
supported targets:
    cont : either pull the singularity container or build from scratch
    data : pull data
    env : create conda env from given file
"

[ $# -eq 0 ] || [[ "${@}" =~ "help" ]] && echo "$usage"

# container setup
[[ "${@}" =~ "cont" ]] || echo "Not touching container"
[[ "${@}" =~ "cont" ]] && echo "pulling container" && \
    apptainer pull "psiturk.sif" "$CONTLINK"

# datasets
[[ "${@}" =~ "data" ]] || [[ "${@}" =~ "data" ]] || echo "Not touching data"
[[ "${@}" =~ "data" ]] && echo "pulling data" && \
    wget "$DATALINK" -O "ecog_pilot_data.tar.gz" && \
    tar -xvzf "ecog_pilot_data.tar.gz" -C "$DATAPATH" && \
    rm "ecog_pilot_data.tar.gz"

# datasets
[[ "${@}" =~ "env" ]] || [[ "${@}" =~ "env" ]] || echo "Not touching conda env"
[[ "${@}" =~ "env" ]] && echo "creating env" && \
    conda env create -n "$ENVNAME" -f env.yml