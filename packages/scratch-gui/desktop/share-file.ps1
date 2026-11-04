param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Title,
    [switch]$Probe
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel, ContentType = WindowsRuntime]
$null = [Windows.ApplicationModel.DataTransfer.DataRequestedEventArgs, Windows.ApplicationModel, ContentType = WindowsRuntime]

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace PackagerShare {
    [ComImport, Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IDataTransferManagerInterop {
        [return: MarshalAs(UnmanagedType.IInspectable)]
        object GetForWindow(IntPtr window, ref Guid iid);
        void ShowShareUIForWindow(IntPtr window);
    }
    public static class Interop {
        public static object GetManager(object factory, IntPtr window) {
            var iid = new Guid("a5caee9b-8708-49d1-8d36-67d25a8da00c");
            return ((IDataTransferManagerInterop)factory).GetForWindow(window, ref iid);
        }
        public static void Show(object factory, IntPtr window) {
            ((IDataTransferManagerInterop)factory).ShowShareUIForWindow(window);
        }
    }
}
'@

$operation = [Windows.Storage.StorageFile]::GetFileFromPathAsync([IO.Path]::GetFullPath($FilePath))
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
$state = [PSCustomObject]@{
    File = $asTask.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($operation)).GetAwaiter().GetResult()
    Title = $Title
    Failed = $false
    Manager = $null
}
$form = New-Object System.Windows.Forms.Form
$form.ShowInTaskbar = $false
$form.Opacity = 0
$form.Width = 1
$form.Height = 1
$form.StartPosition = 'CenterScreen'
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $(if ($Probe) { 3000 } else { 120000 })
$timer.add_Tick({ $form.Close() }.GetNewClosure())
$form.add_Shown({
    try {
        $factory = [System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeMarshal]::GetActivationFactory(
            [Windows.ApplicationModel.DataTransfer.DataTransferManager])
        $state.Manager = [PackagerShare.Interop]::GetManager($factory, $form.Handle)
        $state.Manager.add_DataRequested({
            param($sender, $eventArgs)
            try {
                $eventArgs.Request.Data.Properties.Title = $state.Title
                $eventArgs.Request.Data.SetStorageItems([Windows.Storage.IStorageItem[]]@($state.File))
                [Console]::Out.WriteLine('SHARE_READY')
                [Console]::Out.Flush()
            } catch {
                [Console]::Error.WriteLine($_.Exception.ToString())
                $state.Failed = $true
                $form.Close()
            }
        }.GetNewClosure())
        [PackagerShare.Interop]::Show($factory, $form.Handle)
        [Console]::Out.WriteLine('SHARE_READY')
        [Console]::Out.Flush()
        $timer.Start()
    } catch {
        [Console]::Error.WriteLine($_.Exception.ToString())
        $state.Failed = $true
        $form.Close()
    }
}.GetNewClosure())
try { [System.Windows.Forms.Application]::Run($form) }
finally { $timer.Dispose(); $form.Dispose() }
if ($state.Failed) { exit 1 }
