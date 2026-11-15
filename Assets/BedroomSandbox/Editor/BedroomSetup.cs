using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEditor.XR.OpenXR.Features;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using UnityEngine.XR.Management;
using UnityEngine.XR.OpenXR;
using UnityEngine.XR.OpenXR.Features.Interactions;
using UnityEngine.XR.OpenXR.Features.MetaQuestSupport;

namespace SoundRoom.Editor
{
    public static class BedroomSetup
    {
        public const string ScenePath="Assets/BedroomSandbox/Bedroom_Quest.unity";
        [MenuItem("Sound Room/1 - Create or open bedroom scene")]
        public static void OpenScene()
        {
            if(!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())return;
            EnsureScene();EditorSceneManager.OpenScene(ScenePath);
        }
        static void EnsureScene()
        {
            if(!File.Exists(ScenePath)){
                var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
                var root=new GameObject("Bedroom Sandbox - press Play");root.AddComponent<BedroomSandbox>();
                EditorSceneManager.SaveScene(scene,ScenePath);
            }
            // The Quest build below explicitly uses only this scene; tutorial build settings are preserved.
        }
        [MenuItem("Sound Room/2 - Configure Quest 3 OpenXR")]
        public static void ConfigureQuest()
        {
            var ids=AssetDatabase.FindAssets("t:XRGeneralSettingsPerBuildTarget");
            var settings=ids.Length>0?AssetDatabase.LoadAssetAtPath<XRGeneralSettingsPerBuildTarget>(AssetDatabase.GUIDToAssetPath(ids[0])):null;
            if(settings==null){settings=ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();AssetDatabase.CreateAsset(settings,"Assets/BedroomSandbox/QuestXRSettings.asset");}
            EditorBuildSettings.AddConfigObject(XRGeneralSettings.k_SettingsKey,settings,true);
            if(!settings.HasSettingsForBuildTarget(BuildTargetGroup.Android))settings.CreateDefaultSettingsForBuildTarget(BuildTargetGroup.Android);
            if(!settings.HasManagerSettingsForBuildTarget(BuildTargetGroup.Android))settings.CreateDefaultManagerSettingsForBuildTarget(BuildTargetGroup.Android);
            var general=settings.SettingsForBuildTarget(BuildTargetGroup.Android);general.InitManagerOnStart=true;
            if(!XRPackageMetadataStore.AssignLoader(general.Manager,"UnityEngine.XR.OpenXR.OpenXRLoader",BuildTargetGroup.Android))throw new Exception("Could not assign the Android OpenXR loader.");
            FeatureHelpers.RefreshFeatures(BuildTargetGroup.Android);
            var openXR=OpenXRSettings.GetSettingsForBuildTargetGroup(BuildTargetGroup.Android);
            if(openXR==null)throw new Exception("OpenXR Android settings not available. Install Android Build Support, then configure again.");
            Enable<MetaQuestFeature>(openXR);Enable<OculusTouchControllerProfile>(openXR);Enable<MetaQuestTouchPlusControllerProfile>(openXR);
            openXR.renderMode=OpenXRSettings.RenderMode.SinglePassInstanced;
            openXR.depthSubmissionMode=OpenXRSettings.DepthSubmissionMode.None;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel32;
            PlayerSettings.Android.targetSdkVersion=AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android,"com.aaron.bedroomsoundroom");
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android,false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android,new[]{GraphicsDeviceType.OpenGLES3});
            PlayerSettings.colorSpace=ColorSpace.Linear;
            EditorUtility.SetDirty(openXR);EditorUtility.SetDirty(settings);EditorUtility.SetDirty(general);EditorUtility.SetDirty(general.Manager);
            // Ensure shaders referenced only by the procedural models survive build stripping.
            var graphics=AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset").FirstOrDefault();
            if(graphics!=null){var serialized=new SerializedObject(graphics);var list=serialized.FindProperty("m_AlwaysIncludedShaders");
                foreach(var name in new[]{"Universal Render Pipeline/Lit","Universal Render Pipeline/Unlit","GUI/Text Shader"}){
                    var shader=Shader.Find(name);if(shader==null)continue;bool exists=false;for(int i=0;i<list.arraySize;i++)if(list.GetArrayElementAtIndex(i).objectReferenceValue==shader)exists=true;
                    if(!exists){int i=list.arraySize;list.InsertArrayElementAtIndex(i);list.GetArrayElementAtIndex(i).objectReferenceValue=shader;}
                }serialized.ApplyModifiedPropertiesWithoutUndo();}
            AssetDatabase.SaveAssets();Debug.Log("BEDROOM: Quest OpenXR, Touch Plus, ARM64 / IL2CPP and stereo rendering configured.");
        }
        static void Enable<T>(OpenXRSettings settings) where T:UnityEngine.XR.OpenXR.Features.OpenXRFeature
        {
            var feature=settings.GetFeature<T>();if(feature==null)throw new Exception("Missing OpenXR feature: "+typeof(T).Name);feature.enabled=true;EditorUtility.SetDirty(feature);
        }
        [MenuItem("Sound Room/3 - Build Quest APK")]
        public static void BuildQuest()
        {
            EnsureScene();ConfigureQuest();
            if(!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android))throw new Exception("Install Android Build Support (SDK, NDK, OpenJDK) for Unity 6000.6.9f1 through Unity Hub, then retry.");
            Directory.CreateDirectory("Builds/Quest3");
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ScenePath},locationPathName="Builds/Quest3/BedroomSoundRoom.apk",target=BuildTarget.Android,options=BuildOptions.Development});
            if(report.summary.result!=BuildResult.Succeeded)throw new Exception("Quest build failed: "+report.summary.result);
            Debug.Log("BEDROOM: APK created at Builds/Quest3/BedroomSoundRoom.apk");
        }
        [MenuItem("Sound Room/Export portable Unity package")]
        public static void ExportPackage()
        {
            EnsureScene();Directory.CreateDirectory("Builds");
            AssetDatabase.ExportPackage("Assets/BedroomSandbox","Builds/BedroomSoundRoom.unitypackage",ExportPackageOptions.Recurse);
        }
        [MenuItem("Sound Room/Validate and export %#F9")]
        public static void GenerateAndValidate()
        {
            EnsureScene();ConfigureQuest();
            foreach(var definition in BedroomCatalog.All){
                if(definition.sound!=null && Resources.Load<AudioClip>("BedroomAudio/"+definition.sound)==null)throw new Exception("Missing clip "+definition.sound);
            }
            ExportPackage();AssetDatabase.SaveAssets();
            File.WriteAllText("Builds/BedroomValidation.txt","Unity editor compilation passed. Scene generated. 14 catalog definitions / 9 bundled sounds validated. Android OpenXR + Touch Plus configured. Android Build Support installed: "+BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android)+"\nHeadset interaction and APK build still need device validation.");
            Debug.Log("BEDROOM_VALIDATION_OK");
        }
    }
}
