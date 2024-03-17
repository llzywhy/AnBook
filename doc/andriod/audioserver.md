# audioserver 启动流程

## 本篇文章目标

- 了解 audioserver 启动流程
- 了解 AudioPolicyService 启动流程
- 了解 AudioFlinger 启动流程

## Android 系统的启动流程

在了解audioserver的启动之前先看Android系统的启动流程

![Android 启动流程](../../assets/Android启动流程.svg)

通过上图可以看到Android系统的启动整体流程，而audioserver的启动就是由init进程拉起的，因此audioserver有单独的进程号。

在Android系统中，音频主要有两个子服务，AudioFlinger和AudioPolicy，这两个服务都是运行在audioserver进程中的。

AudioFlinger负责和底层audio hal进行交互，是audio系统的实现者。  
AudioPolicy负责音频策略的定制，是audio系统的指挥者。

## Audio Server 的启动流程

### 加载 audioserver.rc
audioserver.rc是由init进程拉起的，如下图

![Android 启动流程](../../assets/Android启动流程.svg)

init进程对应的main函数  
system/core/init/init.cpp

```
int SecondStageMain(int argc, char** argv) {
    // ......
    LoadBootScripts(am, sm);
    // ......
}
// 看LoadBootScripts()函数
static void LoadBootScripts(ActionManager& action_manager, ServiceList& service_list) {
    Parser parser = CreateParser(action_manager, service_list);
 
    std::string bootscript = GetProperty("ro.boot.init_rc", "");
    if (bootscript.empty()) {
        parser.ParseConfig("/system/etc/init/hw/init.rc");
        if (!parser.ParseConfig("/system/etc/init")) {
            late_import_paths.emplace_back("/system/etc/init");
        }
        // late_import is available only in Q and earlier release. As we don't
        // have system_ext in those versions, skip late_import for system_ext.
        parser.ParseConfig("/system_ext/etc/init");
        if (!parser.ParseConfig("/vendor/etc/init")) {
            late_import_paths.emplace_back("/vendor/etc/init");
        }
        if (!parser.ParseConfig("/odm/etc/init")) {
            late_import_paths.emplace_back("/odm/etc/init");
        }
        if (!parser.ParseConfig("/product/etc/init")) {
            late_import_paths.emplace_back("/product/etc/init");
        }
    } else {
        parser.ParseConfig(bootscript);
    }
}
```

LoadBootScrips()函数中，会首先加载init.rc文件  
然后会加载/system/etc/init/、/product/etc/init/、/odm/etc/init/、/vendor/etc/init目录下的rc文件  
而audioserver.rc位于/system/etc/init 目录下。

### 启动 audioserver 进程

看下audioserver.rc文件，init进程加载audioserver.rc文件时就会启动audioserver进程。

frameworks/av/media/audioserver/audioserver.rc

```
service audioserver /system/bin/audioserver
    class core
    user audioserver # 设置所有者
    # media gid needed for /dev/fm (radio) and for /data/misc/media (tee)
    group audio camera drmrpc media mediadrm net_bt net_bt_admin net_bw_acct wakelock # 设置所属组
    capabilities BLOCK_SUSPEND
    ioprio rt 4
    task_profiles ProcessCapacityHigh HighPerformance
    onrestart restart vendor.audio-hal
    onrestart restart vendor.audio-hal-4-0-msd
    onrestart restart audio_proxy_service
    # Keep the original service names for backward compatibility
    onrestart restart vendor.audio-hal-2-0
    onrestart restart audio-hal-2-0
 
on property:vts.native_server.on=1
    stop audioserver
on property:vts.native_server.on=0
    start audioserver
```

audioserver以及audio hal的进程启动/关闭都是在该文件下执行的。

### audioserver 加载 AudioFlinger 以及 AudioPolicy 的流程

audioserver是在main_audioserver.cpp里面去创建audioflinger和audiopolicy的实例的

frameworks\av\media\audioserver\main_audioserver.cpp

```
int main(int argc __unused, char **argv) {
    // ......
    // 如果doLog为true则创建子进程
    if (doLog && (childPid = fork()) != 0) {
        // ......
    } else {
        // all other services
        if (doLog) {
            prctl(PR_SET_PDEATHSIG, SIGKILL);   // if parent media.log dies before me, kill me also
            setpgid(0, 0);                      // but if I die first, don't kill my parent
        }
        android::hardware::configureRpcThreadpool(4, false /*callerWillJoin*/);
        sp<ProcessState> proc(ProcessState::self());
        sp<IServiceManager> sm = defaultServiceManager();
        ALOGI("ServiceManager: %p", sm.get());
        AudioFlinger::instantiate();
        AudioPolicyService::instantiate();
 
        // AAudioService should only be used in OC-MR1 and later.
        // And only enable the AAudioService if the system MMAP policy explicitly allows it.
        // This prevents a client from misusing AAudioService when it is not supported.
        aaudio_policy_t mmapPolicy = property_get_int32(AAUDIO_PROP_MMAP_POLICY,
                                                        AAUDIO_POLICY_NEVER);
        if (mmapPolicy == AAUDIO_POLICY_AUTO || mmapPolicy == AAUDIO_POLICY_ALWAYS) {
            AAudioService::instantiate();
        }
 
        ProcessState::self()->startThreadPool();
        IPCThreadState::self()->joinThreadPool();
    }
}
```

在main_audioserver.cpp里面主要的逻辑：

① 启动AudioFlinger  
② 启动AudioPolicyService  
③ 如果支持AAudio，则启动AAudioService  
④ 创建线程池并将当前线程加入线程池  

audioserver启动的完整流程如下：


经过上面的流程audioserver已经启动处于待命状态，如果有应用需要播放则会通过服务最终选择合适的硬件将声音播出，接下来按照上面的流程进行进一步的细分。

### AudioFlinger 初始化流程
AudioFlinger::instantiate()，在Android S版本之前，在AudioFlinger并没有实现instantiate函数，直接在其父类找到对应函数。

frameworks/native/libs/binder/include/binder/BinderService.h

```
class BinderService
{
public:
    static status_t publish(bool allowIsolated = false,
                            int dumpFlags = IServiceManager::DUMP_FLAG_PRIORITY_DEFAULT) {
        sp<IServiceManager> sm(defaultServiceManager());
        return sm->addService(String16(SERVICE::getServiceName()), new SERVICE(), allowIsolated,
                              dumpFlags);
    }
 
    static void instantiate() { publish(); }
}
```

在BinderService.h中主要的业务：

① 获取IServiceManager  
② new SERVICE()，这里对应的就是new AudioFlinger()  
③ 将AudioFlinger注册到ServiceManager里面，方便后续别的进程使用该服务  

Android S版本里面将instantiate放在了AudioFlinger里面，代码如下：

AudioFlinger.cpp
```
void AudioFlinger::instantiate() {
    sp<IServiceManager> sm(defaultServiceManager());
    sm->addService(String16(IAudioFlinger::DEFAULT_SERVICE_NAME),
                   new AudioFlingerServerAdapter(new AudioFlinger()), false,
                   IServiceManager::DUMP_FLAG_PRIORITY_DEFAULT);
}
```

由于sm是带sp的(sp<IServiceManager>)强引用类型的指针，因此第一次调用AudioFlinger模块的时候，会调用它的AudioFlinger::onFirstRef()函数

接下来先看AudioFlinger的构造函数：

```
AudioFlinger::AudioFlinger()
    // 默认全局变量的初始化辅助
    ......
{
    // ......
    // 实例化打开设备的接口，通过它可以获取到hal层audio硬件的接口
    mDevicesFactoryHal = DevicesFactoryHalInterface::create();
    // 实例化音效的接口，通过它可以获取到hal层音效的接口
    mEffectsFactoryHal = EffectsFactoryHalInterface::create();
}
```

看AudioFlinger::onFirstRef()的代码：

```
void AudioFlinger::onFirstRef()
{
    Mutex::Autolock _l(mLock);
 
    // ......
 
    mMode = AUDIO_MODE_NORMAL;
 
    gAudioFlinger = this;  // we are already refcounted, store into atomic pointer.
    // 实例化和hal的回调并设置回调函数
    mDevicesFactoryHalCallback = new DevicesFactoryHalCallbackImpl;
    mDevicesFactoryHal->setCallbackOnce(mDevicesFactoryHalCallback);
}
```

至此AudioFlinger就实例化完成了

### AudioPolicyService 的初始化流程

AudioPolicyService也是BinderService子类，其instantiate过程和AudioFlinger是类似的，创建AudioPolicyService，注册到ServiceManager中。直接看AudioPolicy的初始化

先看构造函数：做一些全局变量初始化赋值操作

```
AudioPolicyService::AudioPolicyService()
    : BnAudioPolicyService(),
      mAudioPolicyManager(NULL),
      mAudioPolicyClient(NULL),
      mPhoneState(AUDIO_MODE_INVALID),
      mCaptureStateNotifier(false),
      mCreateAudioPolicyManager(createAudioPolicyManager),
      mDestroyAudioPolicyManager(destroyAudioPolicyManager) {
}
```

和AudioFlinger一样，在初始化的时候会调用AudioPolicyService::onFirstRef()函数，接下来看AudioPolicyService::onFirstRef()函数：

```
void AudioPolicyService::onFirstRef()
{
    {
        Mutex::Autolock _l(mLock);
 
        // start audio commands thread
        // ①创建AudioCommandThread线程，用于执行audio命令
        mAudioCommandThread = new AudioCommandThread(String8("ApmAudio"), this);
        // start output activity command thread
        // ②用于执行audio 输出命令
        mOutputCommandThread = new AudioCommandThread(String8("ApmOutput"), this);
        // ③实例化AudioPolicyClient对象，该对象是AudioFlinger和AudioPolicyService通信的中间
        mAudioPolicyClient = new AudioPolicyClient(this);
        // ④ Android S版本新增，用于加载自定义AudioPolicyManager的支持，如果自定义库存在则加载，如果不存在则恢复默认
        loadAudioPolicyManager();
        // ⑤实例化AudioPolicyManager对象
        mAudioPolicyManager = mCreateAudioPolicyManager(mAudioPolicyClient);
    }
    // load audio processing modules
    // ⑥初始化音效相关的内容
    sp<AudioPolicyEffects> audioPolicyEffects = new AudioPolicyEffects();
    sp<UidPolicy> uidPolicy = new UidPolicy(this);
    sp<SensorPrivacyPolicy> sensorPrivacyPolicy = new SensorPrivacyPolicy(this);
    {
        Mutex::Autolock _l(mLock);
        mAudioPolicyEffects = audioPolicyEffects;
        mUidPolicy = uidPolicy;
        mSensorPrivacyPolicy = sensorPrivacyPolicy;
    }
    uidPolicy->registerSelf();
    sensorPrivacyPolicy->registerSelf();
}
```

而AudioPolicy的管理主要在AudioPolicyManager里面，接下来看AudioPolicyManager

AudioPolicyManager的构造
```
AudioPolicyManager::AudioPolicyManager(AudioPolicyClientInterface *clientInterface)
        : AudioPolicyManager(clientInterface, false /*forTesting*/)
{
    loadConfig();
}
```
 
Andorid S版本是在AudioPolicyService.cpp的createAudioPolicyManager()函数中去调用initialize()函数的

```
static AudioPolicyInterface* createAudioPolicyManager(AudioPolicyClientInterface *clientInterface)
{
    // #ifndef VENDOR_EDIT
    // pengzhao.chen@tcl.com, 2022/04/25, [FAT-9999] Modified for RTK patch
    AudioPolicyManager *apm = nullptr;
    apm = new TclAudioPolicyManager(clientInterface);
    /*
    AudioPolicyManager *apm = new AudioPolicyManager(clientInterface);
    */
    // #endif /* VENDOR_EDIT */
    status_t status = apm->initialize();
    if (status != NO_ERROR) {
        delete apm;
        apm = nullptr;
    }
    return apm;
}
```

再看一下initialize()函数的实现：

```
AudioPolicyManager::initialize()
status_t AudioPolicyManager::initialize() {
    {
        // ① 加载音频engine库
        auto engLib = EngineLibrary::load(
                        "libaudiopolicyengine" + getConfig().getEngineLibraryNameSuffix() + ".so");
        if (!engLib) {
            ALOGE("%s: Failed to load the engine library", __FUNCTION__);
            return NO_INIT;
        }
        // ② 根据前面加载的库调用该函数创建Engine对象
        mEngine = engLib->createEngine();
        if (mEngine == nullptr) {
            ALOGE("%s: Failed to instantiate the APM engine", __FUNCTION__);
            return NO_INIT;
        }
    }
    // ③ 设置APM为监听者
    mEngine->setObserver(this);
    // ④ 初始化检查
    status_t status = mEngine->initCheck();
    if (status != NO_ERROR) {
        LOG_FATAL("Policy engine not initialized(err=%d)", status);
        return status;
    }
    // 获取productStrategy
    mCommunnicationStrategy = mEngine->getProductStrategyForAttributes(
        mEngine->getAttributesForStreamType(AUDIO_STREAM_VOICE_CALL));
 
    // ⑤ 输入输出设备的打开和线程创建
    onNewAudioModulesAvailableInt(nullptr /*newDevices*/);
 
    // make sure default device is reachable
    if (mDefaultOutputDevice == 0 || !mAvailableOutputDevices.contains(mDefaultOutputDevice)) {
        ALOGE_IF(mDefaultOutputDevice != 0, "Default device %s is unreachable",
                 mDefaultOutputDevice->toString().c_str());
        status = NO_INIT;
    }
    // If microphones address is empty, set it according to device type
    for (size_t i = 0; i < mAvailableInputDevices.size(); i++) {
        if (mAvailableInputDevices[i]->address().empty()) {
            if (mAvailableInputDevices[i]->type() == AUDIO_DEVICE_IN_BUILTIN_MIC) {
                mAvailableInputDevices[i]->setAddress(AUDIO_BOTTOM_MICROPHONE_ADDRESS);
            } else if (mAvailableInputDevices[i]->type() == AUDIO_DEVICE_IN_BACK_MIC) {
                mAvailableInputDevices[i]->setAddress(AUDIO_BACK_MICROPHONE_ADDRESS);
            }
        }
    }
 
    ALOGW_IF(mPrimaryOutput == nullptr, "The policy configuration does not declare a primary output");
 
    // Silence ALOGV statements
    property_set("log.tag." LOG_TAG, "D");
    // ⑥ 更新设备
    updateDevicesAndOutputs();
    return status;
}
```

AudioPolicyManager初始化主要依赖于loadConfig()和initialize()函数：

loadConfig()用来加载音频配置文件（audio_policy_configuration.xml）

initialize()主要用于：  
①加载音频engine库  
②根据前面加载的库调用该函数创建Engine对象  
③设置APM为监听者  
④初始化检查  
⑤依次加载 HwModule 并打开其所含 profile 的 outputStream 及 inputStream（audio module模块包括：primary、A2DP、USB、remote_submix、hearing_aid）

最后看下AudioPolicyService的整体加载流程图：

## 总结

audioserver启动会加载AudioFlinger和AudioPolicyService两个服务，这两个服务会加载配置文件，解析音频输入、输出硬件信息，并且加载HIDL，建立与hardware的通信连接，至此audioserver启动完成。

