using System;
using UnityEngine;

namespace SoundRoom
{
    public sealed class BedroomButton : MonoBehaviour
    {
        public Action action;
        public Color normal;
        public void Invoke() { action?.Invoke(); }
        public void Highlight(bool active) { var renderer=GetComponent<Renderer>();if(renderer!=null)renderer.material.color=active?new Color(.65f,.8f,.43f):normal; }
    }
    public sealed class BedroomMenu : MonoBehaviour
    {
        BedroomSandbox sandbox;
        TextMesh status;
        TextMesh selectedText;
        public bool IsOpen => gameObject.activeSelf;
        static Font font;
        public void Initialize(BedroomSandbox room)
        {
            sandbox=room;
            var panel=BedroomModels.Material(new Color(.08f,.13f,.15f));
            BedroomModels.Box(transform,2.55f,2.4f,.035f,0,0,.04f,panel,false);
            Text("BEDROOM / OBJECT LIBRARY",0,1.06f,.065f,Color.white);
            status=Text("",0,.91f,.045f,new Color(.82f,.94f,.62f));
            for(int i=0;i<BedroomCatalog.All.Length;i++)
            {
                var item=BedroomCatalog.All[i];int column=i%3,row=i/3;
                Button(item.title,(column-1)*.79f,.71f-row*.17f,.74f,()=>{sandbox.Add(item.key);Refresh();},item.color);
            }
            selectedText=Text("Point at an object and pull trigger to select",0,-.22f,.039f,Color.white);
            Button("Mute / unmute",-.79f,-.4f,.74f,()=>sandbox.MuteSelected());
            Button("Rotate 45",0,-.4f,.74f,()=>sandbox.RotateSelected());
            Button("Remove",.79f,-.4f,.74f,()=>sandbox.RemoveSelected());
            Button("Volume -",-.79f,-.57f,.74f,()=>sandbox.VolumeSelected(-.1f));
            Button("Volume +",0,-.57f,.74f,()=>sandbox.VolumeSelected(.1f));
            Button("Studio / Cathedral",.79f,-.57f,.74f,()=>sandbox.ToggleAcoustics());
            Button("Before / after",-.79f,-.74f,.74f,()=>sandbox.Compare());
            Button("Reset bedroom",0,-.74f,.74f,()=>sandbox.ResetRoom());
            Button("Close",.79f,-.74f,.74f,Toggle);
            Text("A: library   B: acoustics   Trigger: select / drag",0,-.96f,.035f,new Color(.7f,.78f,.76f));
            Text("Synthesized sounds / Unity reverb / Attractor not connected",0,-1.08f,.03f,new Color(.55f,.64f,.62f));
            ShowInFront();Refresh();
        }
        TextMesh Text(string text,float x,float y,float size,Color color)
        {
            if(font==null)font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            var go=new GameObject("Label");go.transform.SetParent(transform,false);go.transform.localPosition=new Vector3(x,y,-.045f);
            var mesh=go.AddComponent<TextMesh>();mesh.text=text;mesh.anchor=TextAnchor.MiddleCenter;mesh.alignment=TextAlignment.Center;
            mesh.font=font;mesh.fontSize=48;mesh.characterSize=size/4;mesh.color=color;go.GetComponent<MeshRenderer>().sharedMaterial=font.material;
            return mesh;
        }
        void Button(string title,float x,float y,float width,Action action,Color? accent=null)
        {
            Color color=accent.HasValue?Color.Lerp(new Color(.1f,.17f,.18f),accent.Value,.22f):new Color(.17f,.24f,.25f);
            var go=BedroomModels.Box(transform,width,.135f,.025f,x,y,0,BedroomModels.Material(color));go.name=title;
            var button=go.AddComponent<BedroomButton>();button.normal=color;button.action=action;
            Text(title,x,y,.036f,Color.white);
        }
        void ShowInFront()
        {
            var head=sandbox.Player.Head.transform;var forward=Vector3.ProjectOnPlane(head.forward,Vector3.up).normalized;
            transform.position=head.position+forward*1.7f;transform.rotation=Quaternion.LookRotation(forward,Vector3.up);
        }
        public void Toggle(){if(IsOpen)gameObject.SetActive(false);else{ShowInFront();gameObject.SetActive(true);Refresh();}}
        public void Refresh()
        {
            if(status==null)return;
            status.text=$"{sandbox.Objects.Count} / {BedroomSandbox.MaxObjects} objects   |   {(sandbox.Cathedral?"CATHEDRAL":"STUDIO")}";
            var item=sandbox.Selected;
            selectedText.text=item==null?"Select an object with trigger / left click, then open library":item.definition.title+(item.sound==null?" | quiet":$" | {(item.muted?"muted":"on")} | {Mathf.RoundToInt(item.volume*100)}%");
        }
    }
}
