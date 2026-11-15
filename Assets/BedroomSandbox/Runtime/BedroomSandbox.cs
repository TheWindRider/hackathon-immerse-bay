using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Rendering;

namespace SoundRoom
{
    public sealed class BedroomSandbox : MonoBehaviour
    {
        public const int MaxObjects = 24;
        public readonly List<BedroomObject> Objects = new List<BedroomObject>();
        public BedroomObject Selected { get; private set; }
        public bool Cathedral { get; private set; }
        public Transform Room { get; private set; }
        public BedroomPlayer Player { get; private set; }
        public BedroomMenu Menu { get; private set; }
        AudioReverbFilter reverb;
        Transform walls;
        readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
        double epoch;
        string SavePath => Path.Combine(Application.persistentDataPath, "bedroom-layout-v1.json");
        [Serializable] class SavedItem { public string key; public Vector3 position; public float yaw, volume; public bool muted; }
        [Serializable] class Layout { public List<SavedItem> items = new List<SavedItem>(); public bool cathedral; }

        void Awake()
        {
            Application.targetFrameRate = 72;
            QualitySettings.vSyncCount = 0;
            BuildRoom();
            var rig = new GameObject("Bedroom XR / Desktop Rig"); Player = rig.AddComponent<BedroomPlayer>(); Player.Initialize(this);
            reverb = Player.Head.gameObject.AddComponent<AudioReverbFilter>();
            var menu = new GameObject("Bedroom Object Library"); Menu = menu.AddComponent<BedroomMenu>(); Menu.Initialize(this);
            foreach (var definition in BedroomCatalog.All) if (definition.sound != null && !clips.ContainsKey(definition.sound))
            {
                var clip = Resources.Load<AudioClip>("BedroomAudio/" + definition.sound);
                if (clip != null) { clip.LoadAudioData(); clips.Add(definition.sound, clip); }
                else Debug.LogError("Missing BedroomAudio/" + definition.sound);
            }
            epoch = AudioSettings.dspTime + .5;
            if (!LoadLayout()) ResetRoom(false);
            SetAcoustics(Cathedral);
        }
        void BuildRoom()
        {
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(.48f,.54f,.56f);
            Room = new GameObject("Bedroom - 12 by 12 metres").transform;
            var floor = BedroomModels.Material(new Color(.3f,.32f,.29f));
            var wall = BedroomModels.Material(new Color(.22f,.29f,.3f));
            BedroomModels.Box(Room,12,.12f,12,0,-.06f,0,floor);
            walls = new GameObject("Room walls").transform; walls.SetParent(Room,false);
            BedroomModels.Box(walls,12,3.3f,.15f,0,1.65f,6,wall);
            BedroomModels.Box(walls,12,3.3f,.15f,0,1.65f,-6,wall);
            BedroomModels.Box(walls,.15f,3.3f,12,-6,1.65f,0,wall);
            BedroomModels.Box(walls,.15f,3.3f,12,6,1.65f,0,wall);
            var trim = BedroomModels.Material(new Color(.57f,.64f,.53f));
            for(int i=-5;i<=5;i++)BedroomModels.Box(Room,.012f,.004f,12,i,.003f,0,trim,false);
            var sun = new GameObject("Soft bedroom daylight").AddComponent<Light>(); sun.type=LightType.Directional;
            sun.color=new Color(1,.92f,.8f);sun.intensity=1.2f;sun.shadows=LightShadows.None;sun.transform.rotation=Quaternion.Euler(50,-35,0);
        }
        public BedroomObject Add(string key, Vector3? position = null, bool persist = true)
        {
            var definition=BedroomCatalog.Find(key);if(definition==null || Objects.Count>=MaxObjects)return null;
            var go=new GameObject(definition.title);var item=go.AddComponent<BedroomObject>();item.definition=definition;item.volume=definition.volume;
            go.transform.SetParent(Room,false);go.transform.position=position??Player.SpawnPosition;
            BedroomModels.Build(item);Objects.Add(item);Move(item,go.transform.position,false);
            if(definition.sound!=null && clips.TryGetValue(definition.sound,out var clip))
            {
                var emitter=new GameObject("Positional audio");emitter.transform.SetParent(go.transform,false);emitter.transform.localPosition=Vector3.up;
                item.sound=emitter.AddComponent<AudioSource>();item.sound.clip=clip;item.sound.loop=true;item.sound.playOnAwake=false;
                item.sound.spatialBlend=1;item.sound.rolloffMode=AudioRolloffMode.Logarithmic;
                item.sound.minDistance=1.5f;item.sound.maxDistance=20;item.sound.dopplerLevel=0;item.sound.reverbZoneMix=1;
                item.sound.volume=item.volume;item.sound.priority=128;
                var start=Math.Max(AudioSettings.dspTime+.05,epoch);item.sound.time=(float)((start-epoch)%clip.length);item.sound.PlayScheduled(start);
            }
            Select(item);if(persist)SaveLayout();return item;
        }
        public void Select(BedroomObject item) { Selected=item;if(Menu!=null)Menu.Refresh(); }
        public void Move(BedroomObject item, Vector3 position, bool persist=true)
        {
            if(item==null)return;float bound=6-item.definition.radius;
            item.transform.position=new Vector3(Mathf.Clamp(position.x,-bound,bound),0,Mathf.Clamp(position.z,-bound,bound));
            if(persist)SaveLayout();
        }
        public void RemoveSelected()
        {
            if(Selected==null)return;var item=Selected;Objects.Remove(item);Selected=null;
            item.gameObject.SetActive(false);Destroy(item.gameObject);Menu.Refresh();SaveLayout();
        }
        public void RotateSelected(){if(Selected!=null){Selected.transform.Rotate(Vector3.up,45,Space.World);SaveLayout();}}
        public void MuteSelected(){if(Selected!=null){Selected.ToggleMute();Menu.Refresh();SaveLayout();}}
        public void VolumeSelected(float delta){if(Selected!=null){Selected.SetVolume(Selected.volume+delta);Menu.Refresh();SaveLayout();}}
        public void SetAcoustics(bool cathedral)
        {
            Cathedral=cathedral;reverb.reverbPreset=AudioReverbPreset.User;
            reverb.dryLevel=0;reverb.room=cathedral?-500:-1800;reverb.roomHF=cathedral?-900:-300;
            reverb.decayTime=cathedral?5.5f:.35f;reverb.decayHFRatio=.7f;
            reverb.reflectionsLevel=cathedral?-1200:-1800;reverb.reflectionsDelay=cathedral?.04f:.008f;
            reverb.reverbLevel=cathedral?-300:-1600;reverb.reverbDelay=cathedral?.06f:.015f;reverb.diffusion=100;reverb.density=100;
            walls.localScale=new Vector3(1,cathedral?2.5f:1,1);if(Menu!=null)Menu.Refresh();
        }
        public void ToggleAcoustics(){StopAllCoroutines();SetAcoustics(!Cathedral);SaveLayout();}
        public void Compare(){StopAllCoroutines();StartCoroutine(Comparison());}
        IEnumerator Comparison(){SetAcoustics(false);yield return new WaitForSeconds(4.5f);SetAcoustics(true);SaveLayout();}
        public void ResetRoom(bool persist=true)
        {
            StopAllCoroutines();foreach(var item in Objects){item.gameObject.SetActive(false);Destroy(item.gameObject);}Objects.Clear();Selected=null;
            Add("bed",new Vector3(2.7f,0,1.2f),false);Add("lamp",new Vector3(4.3f,0,2.6f),false);
            Add("books",new Vector3(.1f,0,.7f),false);Add("shelf",new Vector3(-4.2f,0,3.9f),false);
            Add("rug",new Vector3(0,0,-1.5f),false);Add("fan",new Vector3(-2.6f,0,.7f),false);
            Add("clock",new Vector3(4.3f,0,-.1f),false);Add("bird",new Vector3(0,0,4.6f),false);
            Selected=null;SetAcoustics(false);if(Menu!=null)Menu.Refresh();if(persist)SaveLayout();
        }
        public void SaveLayout()
        {
            try{var layout=new Layout{cathedral=Cathedral};foreach(var item in Objects)layout.items.Add(new SavedItem{key=item.definition.key,position=item.transform.position,yaw=item.transform.eulerAngles.y,volume=item.volume,muted=item.muted});File.WriteAllText(SavePath,JsonUtility.ToJson(layout,true));}
            catch(Exception e){Debug.LogWarning("Could not save bedroom: "+e.Message);}
        }
        bool LoadLayout()
        {
            try{
                if(!File.Exists(SavePath))return false;var layout=JsonUtility.FromJson<Layout>(File.ReadAllText(SavePath));
                if(layout==null || layout.items==null || layout.items.Count>MaxObjects)return false;
                foreach(var entry in layout.items){if(entry==null || BedroomCatalog.Find(entry.key)==null || !Finite(entry.position))continue;
                    var item=Add(entry.key,entry.position,false);if(item==null)continue;
                    item.transform.rotation=Quaternion.Euler(0,float.IsNaN(entry.yaw)||float.IsInfinity(entry.yaw)?0:entry.yaw,0);
                    item.muted=entry.muted;item.SetVolume(float.IsNaN(entry.volume)||float.IsInfinity(entry.volume)?0:entry.volume);
                }Cathedral=layout.cathedral;Selected=null;return true;
            }catch(Exception e){Debug.LogWarning("Starting a fresh bedroom: "+e.Message);return false;}
        }
        static bool Finite(Vector3 p)=>!(float.IsNaN(p.x)||float.IsNaN(p.z)||float.IsInfinity(p.x)||float.IsInfinity(p.z));
        void OnApplicationPause(bool paused){if(paused)SaveLayout();}
        void OnApplicationQuit(){SaveLayout();}
    }
}
