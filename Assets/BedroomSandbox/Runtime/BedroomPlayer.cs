using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.XR;
using CommonUsages = UnityEngine.XR.CommonUsages;

namespace SoundRoom
{
    public sealed class BedroomPlayer : MonoBehaviour
    {
        public Camera Head { get; private set; }
        public Vector3 SpawnPosition { get { var forward=Vector3.ProjectOnPlane(Head.transform.forward,Vector3.up).normalized;return Head.transform.position+forward*2.5f; } }
        BedroomSandbox sandbox;
        Transform pointer;
        LineRenderer laser;
        BedroomObject held;
        BedroomButton hovered;
        bool triggerWasDown,menuWasDown,presetWasDown,snapReady=true,trackingOriginSet;
        float pitch;
        bool IsVR => XRSettings.isDeviceActive;
        public void Initialize(BedroomSandbox room)
        {
            sandbox=room;transform.position=new Vector3(0,0,-4.5f);
            Head=new GameObject("Head - stereo camera and audio listener").AddComponent<Camera>();Head.transform.SetParent(transform,false);
            Head.transform.localPosition=new Vector3(0,1.65f,0);Head.nearClipPlane=.08f;Head.farClipPlane=40;
            Head.clearFlags=CameraClearFlags.SolidColor;Head.backgroundColor=new Color(.12f,.18f,.2f);Head.tag="MainCamera";
            Head.gameObject.AddComponent<AudioListener>();
            pointer=new GameObject("Right controller ray").transform;pointer.SetParent(transform,false);
            laser=pointer.gameObject.AddComponent<LineRenderer>();laser.positionCount=2;laser.startWidth=.006f;laser.endWidth=.002f;
            laser.sharedMaterial=new Material(Shader.Find("Universal Render Pipeline/Unlit")??Shader.Find("Unlit/Color"));laser.sharedMaterial.color=new Color(.75f,.94f,.55f);
        }
        void Update()
        {
            bool down=false,menu=false,preset=false;
            var left=InputDevices.GetDeviceAtXRNode(XRNode.LeftHand);var right=InputDevices.GetDeviceAtXRNode(XRNode.RightHand);
            Ray ray;
            if(IsVR)
            {
                if(!trackingOriginSet){var systems=new List<XRInputSubsystem>();SubsystemManager.GetSubsystems(systems);foreach(var system in systems)if(system.running)trackingOriginSet=system.TrySetTrackingOriginMode(TrackingOriginModeFlags.Floor);}
                var headDevice=InputDevices.GetDeviceAtXRNode(XRNode.Head);
                if(headDevice.TryGetFeatureValue(CommonUsages.centerEyePosition,out var headPosition)||headDevice.TryGetFeatureValue(CommonUsages.devicePosition,out headPosition))Head.transform.localPosition=headPosition;
                if(headDevice.TryGetFeatureValue(CommonUsages.centerEyeRotation,out var headRotation)||headDevice.TryGetFeatureValue(CommonUsages.deviceRotation,out headRotation))Head.transform.localRotation=headRotation;
                if(right.TryGetFeatureValue(CommonUsages.devicePosition,out var position))pointer.localPosition=position;
                if(right.TryGetFeatureValue(CommonUsages.deviceRotation,out var rotation))pointer.localRotation=rotation;
                right.TryGetFeatureValue(CommonUsages.triggerButton,out down);right.TryGetFeatureValue(CommonUsages.primaryButton,out menu);right.TryGetFeatureValue(CommonUsages.secondaryButton,out preset);
                if(left.TryGetFeatureValue(CommonUsages.primary2DAxis,out var move) && move.magnitude>.15f && !sandbox.Menu.IsOpen)Walk(move,1.6f);
                if(right.TryGetFeatureValue(CommonUsages.primary2DAxis,out var turn))
                {
                    if(Mathf.Abs(turn.x)<.3f)snapReady=true;
                    if(Mathf.Abs(turn.x)>.7f && snapReady && !sandbox.Menu.IsOpen){transform.RotateAround(Head.transform.position,Vector3.up,Mathf.Sign(turn.x)*30);snapReady=false;}
                }
                ray=new Ray(pointer.position,pointer.forward);
            }
            else
            {
                var keyboard=Keyboard.current;var mouse=Mouse.current;
                if(keyboard!=null){menu=keyboard.tabKey.isPressed;preset=keyboard.cKey.isPressed;
                    if(!sandbox.Menu.IsOpen){Vector2 move=new Vector2((keyboard.dKey.isPressed?1:0)-(keyboard.aKey.isPressed?1:0),(keyboard.wKey.isPressed?1:0)-(keyboard.sKey.isPressed?1:0));Walk(Vector2.ClampMagnitude(move,1),2.5f);}}
                if(mouse!=null){down=mouse.leftButton.isPressed;
                    if(mouse.rightButton.isPressed && !sandbox.Menu.IsOpen){Vector2 delta=mouse.delta.ReadValue();transform.Rotate(Vector3.up,delta.x*.12f);pitch=Mathf.Clamp(pitch-delta.y*.12f,-75,75);Head.transform.localRotation=Quaternion.Euler(pitch,0,0);}
                    ray=Head.ScreenPointToRay(mouse.position.ReadValue());
                }else ray=new Ray(Head.transform.position,Head.transform.forward);
                pointer.SetPositionAndRotation(ray.origin,Quaternion.LookRotation(ray.direction));
            }
            if(menu&&!menuWasDown)sandbox.Menu.Toggle();if(preset&&!presetWasDown)sandbox.ToggleAcoustics();
            menuWasDown=menu;presetWasDown=preset;
            if(hovered!=null)hovered.Highlight(false);hovered=null;
            bool hitSomething=Physics.Raycast(ray,out var hit,15);
            if(hitSomething)hovered=hit.collider.GetComponentInParent<BedroomButton>();
            if(hovered!=null)hovered.Highlight(true);
            if(down&&!triggerWasDown)
            {
                if(hovered!=null)hovered.Invoke();
                else if(hitSomething&&!sandbox.Menu.IsOpen){held=hit.collider.GetComponentInParent<BedroomObject>();if(held!=null)sandbox.Select(held);}
            }
            if(down&&held!=null&&!sandbox.Menu.IsOpen)
            {
                var floor=new Plane(Vector3.up,Vector3.zero);
                if(floor.Raycast(ray,out float distance)&&distance<20)sandbox.Move(held,ray.GetPoint(distance),false);
            }
            if(!down&&triggerWasDown&&held!=null){sandbox.SaveLayout();held=null;}
            triggerWasDown=down;
            laser.enabled=IsVR;laser.SetPosition(0,ray.origin);laser.SetPosition(1,hitSomething?hit.point:ray.GetPoint(8));
            // Keep virtual walking inside the room. Real room-scale tracking stays unmodified.
            transform.position=new Vector3(Mathf.Clamp(transform.position.x,-5.3f,5.3f),0,Mathf.Clamp(transform.position.z,-5.3f,5.3f));
        }
        void Walk(Vector2 move,float speed)
        {
            var forward=Vector3.ProjectOnPlane(Head.transform.forward,Vector3.up).normalized;
            var right=Vector3.Cross(Vector3.up,forward);transform.position+=(forward*move.y+right*move.x)*speed*Time.deltaTime;
        }
        void OnGUI()
        {
            if(IsVR)return;
            GUI.Box(new Rect(12,12,650,72),"BEDROOM SOUND ROOM\nWASD walk | Hold right mouse to look | Left click + drag objects\nTab: object library | C: Studio / Cathedral | Headphones recommended");
        }
    }
}
