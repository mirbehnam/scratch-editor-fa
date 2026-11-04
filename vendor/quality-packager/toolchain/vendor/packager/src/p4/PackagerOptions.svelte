<script>
  import {onDestroy, onMount, tick} from 'svelte';
  // Standard JSON can't represent values such as Infinity, which some options use.
  import * as ExtendedJSON from '@turbowarp/json';
  import {_} from '../locales/';
  import {slide, fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import Button from '../p4/Button.svelte';
  import ImageInput from './ImageInput.svelte';
  import LearnMore from './LearnMore.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import writablePersistentStore from './persistent-store';
  import fileStore from './file-store';
  import {progress, currentTask, error} from './stores';
  import deepClone from './deep-clone';
  import Packager from '../packager/web/export';
  import Task from './task';
  import downloadURL from './download-url';
  import {recursivelySerializeBlobs, recursivelyDeserializeBlobs} from './blob-serializer';
  import {readAsText} from '../common/readers';
  import merge from './merge';
  import DropArea from './DropArea.svelte';
  import {createQualityPreset, identifyQualityPreset} from './quality-presets';
  import {waitForMinimumBuildTime} from './build-timing';
  import {APP_NAME} from '../packager/brand';

  export let projectData;
  export let title;
  const automaticBuild = new URLSearchParams(location.search).get('autobuild') === 'high';

  const cloudVariables = projectData.project.analysis.stageVariables
    .filter(i => i.isCloud)
    .map(i => i.name);

  const projectDefaults = Packager.DEFAULT_OPTIONS();
  const defaultOptions = createQualityPreset(projectDefaults, 'medium');
  defaultOptions.projectId = projectData.projectId || `p4-${projectData.uniqueId}`;
  for (const variable of cloudVariables) {
    defaultOptions.cloudVariables.custom[variable] = 'ws';
  }
  defaultOptions.app.packageName = Packager.getDefaultPackageNameFromFileName(projectData.title);
  defaultOptions.app.windowTitle = Packager.getWindowTitleFromFileName(projectData.title);
  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, defaultOptions);

  // Infinite clones used to be stored as a big number instead of actual `Infinity`.
  const ALMOST_INFINITY = 9999999999;
  if ($options.maxClones === ALMOST_INFINITY) {
    $options.maxClones = Infinity;
  }

  const hasMagicComment = (magic) => projectData.project.analysis.stageComments.find(
    (text) => text.split('\n').find((line) => line.endsWith(magic))
  );
  const hasSettingsStoredInProject = hasMagicComment(' // _twconfig_');

  let result = null;
  let building = false;
  let disposed = false;
  let buildController;
  $: selectedPreset = identifyQualityPreset($options, defaultOptions);
  const resetResult = () => { result = null; };
  $: $options, resetResult(), currentTask.abort();

  const icon = fileStore.writableFileStore(`PackagerOptions.icon.${projectData.uniqueId}`);
  $: $options.app.icon = $icon;

  const customCursorIcon = fileStore.writableFileStore(`PackagerOptions.customCursorIcon.${projectData.uniqueId}`);
  $: $options.cursor.custom = $customCursorIcon;

  const loadingScreenImage = fileStore.writableFileStore(`PackagerOptions.loadingScreenImage.${projectData.uniqueId}`);
  $: $options.loadingScreen.image = $loadingScreenImage;

  $: title = $options.app.windowTitle;

  const setOptions = (newOptions) => {
    $options = newOptions;
    $icon = $options.app.icon;
    $customCursorIcon = $options.cursor.custom;
    $loadingScreenImage = $options.loadingScreen.image;
  };

  const automaticallyCenterCursor = () => {
    const icon = $customCursorIcon;
    const url = URL.createObjectURL(icon)
    const image = new Image();
    const cleanup = () => {
      image.onerror = null;
      image.onload = null;
      URL.revokeObjectURL(url);
    };
    image.onload = () => {
      $options.cursor.center.x = Math.round(image.width / 2);
      $options.cursor.center.y = Math.round(image.height / 2);
      cleanup();
    };
    image.onerror = () => {
      cleanup();
      $error = new Error('Image could not be loaded');
      throw $error;
    };
    image.src = url;
  };

  const runPackager = async (task, options) => {
    const packager = new Packager();
    packager.options = {...options, target: 'html'};
    packager.project = projectData.project;

    task.addEventListener('abort', () => {
      packager.abort();
    });

    task.setProgressText($_('progress.loadingScripts'));

    packager.addEventListener('fetch-extensions', ({detail}) => {
      task.setProgressText($_('progress.downloadingExtensions'));
      task.setProgress(detail.progress);
    });
    packager.addEventListener('large-asset-fetch', ({detail}) => {
      let thing;
      if (detail.asset.startsWith('nwjs-')) {
        thing = 'NW.js';
      } else if (detail.asset.startsWith('electron-')) {
        thing = 'Electron';
      } else if (detail.asset === 'webview-mac') {
        thing = 'WKWebView';
      } else if (detail.asset === 'steamworks.js') {
        thing = 'Steamworks.js';
      }
      if (thing) {
        task.setProgressText($_('progress.loadingLargeAsset').replace('{thing}', thing));
      }
      task.setProgress(detail.progress);
    });
    packager.addEventListener('zip-progress', ({detail}) => {
      task.setProgressText($_('progress.compressingProject'));
      task.setProgress(detail.progress);
    });

    const result = await packager.package();
    result.blob = new Blob([result.data], {
      type: result.type
    });
    return result;
  };

  const selectPreset = quality => setOptions(createQualityPreset(defaultOptions, quality));

  const pack = async () => {
    if (building) return;
    resetResult();
    building = true;
    const started = performance.now();
    buildController = new AbortController();
    const task = new Task();
    task.whenAbort(() => buildController.abort());
    try {
      const output = await task.do(runPackager(task, deepClone($options)));
      if (!automaticBuild) await waitForMinimumBuildTime(started, buildController.signal);
      result = output;
      task.done();
      window.parent.postMessage({p4: {type: 'export-ready', name: result.filename,
        mime: result.type, blob: result.blob}}, location.protocol === 'file:' ? '*' : location.origin);
    } catch (e) {
      if (!task.aborted) {
        task.error(e);
        window.parent.postMessage({p4: {type: 'build-error'}}, location.protocol === 'file:' ? '*' : location.origin);
      }
    } finally {
      building = false;
    }
  };

  onMount(() => {
    if (automaticBuild) {
      selectPreset('high');
      tick().then(() => { if (!disposed) pack(); });
    }
  });

  const resetOptions = (properties) => {
    for (const key of properties) {
      let current = $options;
      let defaults = defaultOptions;
      const parts = key.split('.');
      const lastPart = parts.pop();
      for (const i of parts) {
        current = current[i];
        defaults = defaults[i];
      }
      current[lastPart] = deepClone(defaults[lastPart]);
    }
    $options = $options;
  };

  const resetAll = () => {
    if (confirm($_('reset.confirmAll'))) {
      resetOptions(Object.keys($options));
      $icon = null;
      $customCursorIcon = null;
      $loadingScreenImage = null;
    }
  };

  const exportOptions = async () => {
    const exported = await recursivelySerializeBlobs($options);
    const blob = new Blob([ExtendedJSON.stringify(exported)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const formattedAppName = APP_NAME
      .replace(/[^a-z0-9 ]/gi, '')
      .replace(/ /g, '-')
      .toLowerCase();
    downloadURL(`${formattedAppName}-settings.json`, url);
    URL.revokeObjectURL(url);
  };
    
  const importOptions = async () => {
    const input = document.createElement("input");
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      importOptionsFromDataTransfer(e.target);
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
  };

  const importOptionsFromDataTransfer = async (dataTransfer) => {
    const file = dataTransfer.files[0];
    if (!file) {
      // Should never happen.
      return;
    }
    try {
      const text = await readAsText(file);
      const parsed = ExtendedJSON.parse(text);
      const deserialized = recursivelyDeserializeBlobs(parsed);
      const copiedDefaultOptions = deepClone(defaultOptions);
      const mergedWithDefaults = merge(deserialized, copiedDefaultOptions);
      if (mergedWithDefaults.maxClones === ALMOST_INFINITY) {
        mergedWithDefaults.maxClones = Infinity;
      }

      const isUnsafe = Packager.usesUnsafeOptions(mergedWithDefaults);
      if (!isUnsafe || confirm($_('options.confirmImportUnsafe'))) {
        setOptions(mergedWithDefaults);
      }
    } catch (e) {
      $error = e;
    }
  };

  onDestroy(() => {
    disposed = true;
    if (buildController) buildController.abort();
    currentTask.abort();
  });
</script>

<style>
  .option {
    display: block;
    margin: 4px 0;
  }
  .group {
    margin: 12px 0;
  }
  p {
    margin: 8px 0;
  }
  .group:last-child, .option:last-child, p:last-child {
    margin-bottom: 0;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 150px;
  }
  input[type="text"] {
    width: 200px;
  }
  input[type="text"].shorter {
    width: 150px;
  }
  input[type="number"] {
    width: 50px;
  }
  input:invalid, .version:placeholder-shown {
    outline: 2px solid red;
  }
  .warning {
    font-weight: bold;
    background: yellow;
    color: black;
    padding: 10px;
    border-radius: 10px;
  }
  .buttons {
    display: flex;
  }
  .button {
    margin-right: 4px;
  }
  .side-buttons {
    display: flex;
    margin-left: auto;
  }
  .presets { display: flex; gap: 12px; }
  .presets button { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 16px; text-align: start; border: 2px solid var(--packager-border); background: var(--packager-surface)!important; color: var(--packager-text); cursor: pointer; }
  .presets .chosen { border-color: var(--packager-accent); box-shadow: 0 0 0 2px var(--packager-accent); }
  .presets span { font-size: 0.9em; opacity: 0.8; }
  .advanced-controls { max-width: 657px; margin: 12px auto; }
  .advanced-controls > summary { padding: 14px; border: 1px solid var(--packager-border); border-radius: 8px; background: var(--packager-surface); font-weight: bold; }
  .recommendation { padding: 8px 14px; font-size: 0.95em; opacity: 0.8; }
  .custom-preset { font-size: 0.9em; }
  .build-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; background: var(--packager-background); }
  .build-card { width: 360px; max-width: 100%; text-align: center; padding: 24px; border: 1px solid var(--packager-border); border-radius: 16px; background: var(--packager-surface); box-shadow: 0 12px 48px #0002; }
  .build-spinner { width: 52px; height: 52px; margin: 0 auto 20px; border: 4px solid var(--packager-border); border-top-color: var(--packager-accent); border-radius: 50%; animation: spin 0.9s linear infinite; }
  .build-track { height: 5px; margin-top: 20px; overflow: hidden; border-radius: 8px; background: var(--packager-border); }
  .build-track span { display: block; width: 35%; height: 100%; border-radius: inherit; background: var(--packager-accent); animation: sweep 1.6s ease-in-out infinite alternate; }
  .build-note { font-size: 0.85em; opacity: 0.75; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes sweep { to { transform: translateX(185%); } }
  @media (prefers-reduced-motion: reduce) { .build-spinner, .build-track span { animation: none; } }
  @media (max-width: 500px) { .presets { flex-direction: column; } }
</style>

<div aria-busy={building} inert={building}>
<Section accent="#4c97ff">
  <h2>{$_('embedded.quality')}</h2>
  <div class="presets" role="group" aria-label={$_('embedded.quality')}>
    <button type="button" class:chosen={selectedPreset === 'high'} aria-pressed={selectedPreset === 'high'} on:click={() => selectPreset('high')}>
      <strong>{$_('embedded.high')}</strong>
      <span>{$_('embedded.highDescription')}</span>
    </button>
    <button type="button" class:chosen={selectedPreset === 'medium'} aria-pressed={selectedPreset === 'medium'} on:click={() => selectPreset('medium')}>
      <strong>{$_('embedded.medium')}</strong>
      <span>{$_('embedded.mediumDescription')}</span>
    </button>
  </div>
  {#if !selectedPreset}<p class="custom-preset">{$_('embedded.customized')}</p>{/if}
</Section>

<details class="advanced-controls">
  <summary>{$_('embedded.advanced')}</summary>
  <p class="recommendation">{$_('embedded.recommendation')}</p>
<Section
  accent="#FFAB19"
  reset={() => {
    resetOptions([
      'turbo',
      'framerate',
      'interpolation',
      'highQualityPen',
      'maxClones',
      'fencing',
      'miscLimits',
      'stageWidth',
      'stageHeight',
      'resizeMode',
      'username'
    ]);
  }}
>
  <div>
    <h2>{$_('options.runtimeOptions')}</h2>

    {#if hasSettingsStoredInProject}
      <div class="group">
        {$_('options.storedWarning')}
      </div>
    {/if}

    <label class="option">
      <input type="checkbox" bind:checked={$options.turbo}>
      {$_('options.turbo')}
    </label>
    <div class="option">
      <label>
        {$_('options.framerate')}
        <input type="number" min="0" max="240" bind:value={$options.framerate}>
      </label>
      <LearnMore slug="custom-fps" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.interpolation}>
        {$_('options.interpolation')}
      </label>
      <LearnMore slug="interpolation" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.highQualityPen}>
        {$_('options.highQualityPen')}
      </label>
      <LearnMore slug="high-quality-pen" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={$options.maxClones === Infinity} on:change={(e) => {
          $options.maxClones = e.target.checked ? Infinity : 300;
        }}>
        {$_('options.infiniteClones')}
      </label>
      <LearnMore slug="infinite-clones" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.fencing} on:change={(e) => {
          $options.fencing = !e.target.checked;
        }}>
        {$_('options.removeFencing')}
      </label>
      <LearnMore slug="remove-fencing" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.miscLimits} on:change={(e) => {
          $options.miscLimits = !e.target.checked;
        }}>
        {$_('options.removeMiscLimits')}
      </label>
      <LearnMore slug="remove-misc-limits" />
    </div>
    <label class="option">
      {$_('options.username')}
      <input type="text" class="shorter" bind:value={$options.username}>
    </label>
    {#if $options.username !== defaultOptions.username && cloudVariables.length !== 0}
      <p class="warning">
        {$_('options.customUsernameWarning')}
      </p>
    {/if}
    <label class="option">
      <input type="checkbox" bind:checked={$options.closeWhenStopped}>
      {$_('options.closeWhenStopped')}
    </label>

    <h3>{$_('options.stage')}</h3>
    <label class="option">
      {$_('options.stageSize')}
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageWidth}>
      &times;
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageHeight}>
      <LearnMore slug="custom-stage-size" />
    </label>
    <div class="group">
      <label class="option">
        <input type="radio" name="resize-mode" value="preserve-ratio" bind:group={$options.resizeMode}>
        {$_('options.preserveRatio')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="stretch" bind:group={$options.resizeMode}>
        {$_('options.stretch')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="dynamic-resize" bind:group={$options.resizeMode}>
        {$_('options.dynamicResize')}
        <LearnMore slug="packager/dynamic-stage-resize" />
      </label>
    </div>
  </div>
</Section>

<Section
  accent="#9966FF"
  reset={() => {
    $icon = null;
    $loadingScreenImage = null;
    resetOptions([
      'app.windowTitle',
      'loadingScreen',
      'autoplay',
      'controls',
      'appearance',
      'monitors',
    ]);
  }}
>
  <div>
    <h2>{$_('options.playerOptions')}</h2>

    <label class="option">
      {$_('options.pageTitle')}
      <input type="text" bind:value={$options.app.windowTitle}>
    </label>
    <div class="option">
      {$_('options.icon')}
      <ImageInput bind:file={$icon} previewSizes={[[64, 64], [32, 32], [16, 16]]} />
    </div>

    <h3>{$_('options.loadingScreen')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.loadingScreen.progressBar}>
      {$_('options.showProgressBar')}
    </label>
    <label class="option">
      {$_('options.loadingScreenText')}
      <input type="text" bind:value={$options.loadingScreen.text} placeholder={$_('options.loadingScreenTextPlaceholder')}>
    </label>
    <div class="option">
      {$_('options.loadingScreenImage')}
      <!-- Display preview at image's native size -->
      <ImageInput bind:file={$loadingScreenImage} previewSizes={[['', '']]} />
    </div>
    {#if $loadingScreenImage}
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="normal" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeNormal')}
      </label>
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="stretch" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeStretch')}
      </label>
    {/if}

    <h3>{$_('options.controls')}</h3>
    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.autoplay}>
        {$_('options.autoplay')}
      </label>
      {#if $options.autoplay}
        {$_('options.autoplayHint')}
      {/if}
    </div>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
      {$_('options.showFlag')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
      {$_('options.showStop')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.pause.enabled}>
      {$_('options.showPause')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
      {$_('options.showFullscreen')}
    </label>
    <p>{$_('options.controlsHelp')}</p>

    <h3>{$_('options.colors')}</h3>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.background} />
      {$_('options.backgroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.foreground} />
      {$_('options.foregroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.accent} />
      {$_('options.accentColor')}
    </label>

    <h3>{$_('options.monitors')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.monitors.editableLists}>
      {$_('options.editableLists')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.monitors.variableColor} />
      {$_('options.variableColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.monitors.listColor} />
      {$_('options.listColor')}
    </label>
  </div>
</Section>

<Section
  accent="#4CBFE6"
  reset={() => {
    $customCursorIcon = null;
    resetOptions([
      'cursor',
      'chunks',
    ]);
  }}
>
  <div>
    <h2>{$_('options.interaction')}</h2>
    <div class="group">
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="auto">
        {$_('options.normalCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="none">
        {$_('options.noCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="custom">
        {$_('options.customCursor')}
      </label>
    </div>
    {#if $options.cursor.type === 'custom'}
      <div in:slide|self class="option">
        <ImageInput bind:file={$customCursorIcon} previewSizes={[[32, 32], [16, 16]]} />
        <p>{$_('options.cursorHelp')}</p>
        <label class="option">
          {$_('options.cursorCenter')}
          <!-- X: and Y: intentionally not translated -->
          X: <input type="number" min="0" bind:value={$options.cursor.center.x}>
          Y: <input type="number" min="0" bind:value={$options.cursor.center.y}>
          <button
            on:click={automaticallyCenterCursor}
            disabled={!$customCursorIcon}
          >
            {$_('options.automaticallyCenter')}
          </button>
        </label>
      </div>
    {/if}

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.pointerlock}>
        {$_('options.pointerlock')}
      </label>
      <a href="https://experiments.turbowarp.org/pointerlock/" target="_blank" rel="noopener noreferrer">
        {$_('options.pointerlockHelp')}
      </a>
    </div>

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.gamepad}>
        {$_('options.gamepad')}
      </label>
      <a href="https://turbowarp.org/addons#gamepad" target="_blank" rel="noopener noreferrer">
        {$_('options.gamepadHelp')}
      </a>
    </div>
  </div>
</Section>

<Section
  accent="#FF8C1A"
  reset={cloudVariables.length === 0 ? null : () => {
    resetOptions([
      'cloudVariables'
    ]);
  }}
>
  <div>
    <h2>{$_('options.cloudVariables')}</h2>

    {#if cloudVariables.length > 0}
      <label class="option">
        {$_('options.mode')}
        <select bind:value={$options.cloudVariables.mode}>
          <option value="ws">{$_('options.cloudVariables-ws')}</option>
          <option value="local">{$_('options.cloudVariables-local')}</option>
          <option value="">{$_('options.cloudVariables-ignore')}</option>
          <option value="custom">{$_('options.cloudVariables-custom')}</option>
        </select>
      </label>

      {#if $options.cloudVariables.mode === "custom"}
        <div transition:fade|local>
          {#each cloudVariables as variable}
            <label class="option">
              <select bind:value={$options.cloudVariables.custom[variable]}>
                <option value="ws">{$_('options.cloudVariables-ws')}</option>
                <option value="local">{$_('options.cloudVariables-local')}</option>
                <option value="">{$_('options.cloudVariables-ignore')}</option>
              </select>
              {variable}
            </label>
          {/each}
        </div>
      {/if}

      {#if $options.cloudVariables.mode === 'ws' || $options.cloudVariables.mode === 'custom'}
        <div transition:fade|local>
          <label class="option">
            {$_('options.cloudVariablesHost')}
            <!-- Examples of valid values: -->
            <!-- wss://clouddata.turbowarp.org -->
            <!-- ws:localhost:8080 -->
            <input type="text" bind:value={$options.cloudVariables.cloudHost} pattern="wss?:.*">
          </label>
        </div>
      {/if}

      <p>{$_('options.cloudVariables-ws-help')}</p>
      <p>{$_('options.cloudVariables-local-help')}</p>
      <p>{$_('options.cloudVariables-ignore-help')}</p>
      <p>{$_('options.cloudVariables-custom-help')}</p>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.specialCloudBehaviors}>
          {$_('options.specialCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors" />
      </div>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.unsafeCloudBehaviors}>
          {$_('options.unsafeCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors#eval" />
      </div>
      {#if $options.cloudVariables.unsafeCloudBehaviors}
        <p class="warning">{$_('options.unsafeCloudBehaviorsWarning')}</p>
      {/if}
      <p>{$_('options.implicitCloudHint').replace('{cloud}', '☁')}</p>
    {:else}
      <p>{$_('options.noCloudVariables')}</p>
    {/if}
  </div>
</Section>

<Section
  accent="#FF6680"
  reset={() => {
    resetOptions([
      'compiler',
      'bakeExtensions',
      'custom',
      'projectId',
      'maxTextureDimension'
    ]);
  }}
>
  <div>
    <h2>{$_('embedded.engineOptions')}</h2>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.enabled}>
          {$_('options.enableCompiler')}
        </label>
        <LearnMore slug="disable-compiler" />
      </div>
      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.warpTimer}>
          {$_('options.warpTimer')}
        </label>
        <LearnMore slug="warp-timer" />
      </div>

      <label class="option">
        <input type="checkbox" bind:checked={$options.bakeExtensions}>
        {$_('options.bakeExtensions')}
      </label>

      <label class="option">
        {$_('options.customCSS')}
        <textarea bind:value={$options.custom.css}></textarea>
      </label>
      <label class="option">
        {$_('options.customJS')}
        <textarea bind:value={$options.custom.js}></textarea>
      </label>

      <label class="option">
        {$_('options.projectId')}
        <input type="text" bind:value={$options.projectId}>
      </label>
      <p>{$_('options.projectIdHelp')}</p>

      <label class="option">
        <input type="checkbox" bind:checked={$options.packagedRuntime} />
        {$_('options.packagedRuntime')}
      </label>

      <label class="option">
        <input type="checkbox" checked={$options.maxTextureDimension !== defaultOptions.maxTextureDimension} on:change={(e) => {
          $options.maxTextureDimension = defaultOptions.maxTextureDimension * (e.target.checked ? 2 : 1);
        }} />
        {$_('options.maxTextureDimension')}
      </label>
  </div>
</Section>

<Section>
  <DropArea on:drop={(e) => importOptionsFromDataTransfer(e.detail)}>
    <div class="buttons">
      <div class="button">
        <Button on:click={exportOptions} secondary text={$_('options.export')} />
      </div>
      <div class="button">
        <Button on:click={importOptions} secondary text={$_('options.import')} />
      </div>
      <div class="side-buttons">
        <Button on:click={resetAll} dangerous text={$_('options.resetAll')} />
      </div>
    </div>
  </DropArea>
</Section>

</details>

<Section>
  <div class="buttons">
    <div class="button">
      <Button on:click={pack} text={$_('options.package')} />
    </div>

  </div>
</Section>


</div>
{#if building}
  <div class="build-overlay" role="status" aria-live="polite">
    <div class="build-card">
      <div class="build-spinner" aria-hidden="true"></div>
      <h2>{$_('embedded.building')}</h2>
      <p>{$progress.text || $_('embedded.preparing')}</p>
      <div class="build-track" aria-hidden="true"><span></span></div>
      <p class="build-note">{$_('embedded.buildNote')}</p>
    </div>
  </div>
{/if}
