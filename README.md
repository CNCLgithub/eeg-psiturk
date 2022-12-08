# Psiturk Experiment

Psiturk experiment used in Galileo (response slider) style experiments.

Based off of [CNCLgithub/rooms-psiturk](https://github.com/CNCLgithub/rooms-psiturk).
## Setup Linux

### dependencies

- singularity
- wget
- tar


### setup

see help

```bash
chmod +x setup.sh
./setup.sh --help
./setup.sh cont data
```

### running the server
```bash
apptainer shell psiturk.sif
cd psiturk
psiturk server on
```

This setup file will, by default, pull a container and data files from box.

## Setup Mac

### dependencies
- conda
- tar

### setup

```bash
chmod +x setup.sh
./setup.sh --help
./setup.sh data env
```


## Running psiturk


```bash
conda activate eeg-psiturk-env
cd psiturk/
psiturk server on
```


## API

### task.js

The majority of the experiment's functionality is described in `psiturk/static/js/task.js` 

The main class used to setup pages for both the experiment and instructions is defined as `Page`.
`Page` handles both media presentation and scale setup. See the docstrings for more info.

There are three other main elements, `InstructionRunner`, `Quiz`, and `Experiment`. 


### css and html

The main html files are located under `psiturk/templates/` and css is under `psiturk/static/css`.

Notabley, `stage.html` describes the pages for experimental trials and `slider.css` describes some of the elements found in the scale. 


