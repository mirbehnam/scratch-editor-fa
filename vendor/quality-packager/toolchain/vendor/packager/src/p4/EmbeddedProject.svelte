<script>
  import importExternalProject from './import-external-project';
  import loadProject from '../packager/load-project';
  import Task from './task';
  import {_} from '../locales';

  export let projectData = null;
  importExternalProject({
    onStartImporting: () => {},
    onCancelImporting: () => {},
    onFinishImporting: async files => {
      const task = new Task();
      try {
        task.setProgressText($_('progress.loadingProjectData'));
        const file = files[0];
        const operation = await loadProject.fromFile(file, (type, a, b) => {
          task.setProgress(b ? a / b : a);
        });
        task.whenAbort(operation.terminate);
        const project = await task.do(operation.promise);
        projectData = {projectId: null, uniqueId: `@${file.name}`, title: file.name, project};
        task.done();
        window.parent.postMessage({p4: {type: 'imported'}}, location.protocol === 'file:' ? '*' : location.origin);
      } catch (error) {
        task.error(error);
        window.parent.postMessage({p4: {type: 'build-error'}}, location.protocol === 'file:' ? '*' : location.origin);
      }
    }
  });
</script>
