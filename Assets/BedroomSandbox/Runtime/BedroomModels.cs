using UnityEngine;

namespace SoundRoom
{
    public static class BedroomModels
    {
        static Material wood, cream, dark, metal;
        public static Material Material(Color color)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var material = new Material(shader) { color = color };
            return material;
        }
        static void Init()
        {
            if (wood != null) return;
            wood = Material(new Color(.32f,.25f,.19f)); cream = Material(new Color(.91f,.88f,.78f));
            dark = Material(new Color(.08f,.12f,.13f)); metal = Material(new Color(.52f,.6f,.61f));
        }
        public static GameObject Shape(Transform parent, PrimitiveType type, Vector3 position, Vector3 scale, Material material, bool collider = true)
        {
            var go = GameObject.CreatePrimitive(type); go.transform.SetParent(parent, false);
            go.transform.localPosition = position; go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = material;
            if (!collider) Object.Destroy(go.GetComponent<Collider>());
            return go;
        }
        public static GameObject Box(Transform p, float w, float h, float d, float x, float y, float z, Material m, bool collider = true)
            => Shape(p, PrimitiveType.Cube, new Vector3(x,y,z), new Vector3(w,h,d), m, collider);
        static GameObject Cylinder(Transform p, float r, float h, float x, float y, float z, Material m)
            => Shape(p, PrimitiveType.Cylinder, new Vector3(x,y,z), new Vector3(r*2,h/2,r*2), m);
        static void Table(Transform t)
        {
            Box(t,.85f,.1f,.65f,0,.72f,0,wood);
            foreach(float x in new[]{-.34f,.34f}) foreach(float z in new[]{-.23f,.23f}) Box(t,.06f,.68f,.06f,x,.34f,z,wood);
        }
        public static void Build(BedroomObject item)
        {
            Init(); var t = item.transform; var accent = Material(item.definition.color);
            switch(item.definition.key)
            {
                case "bed":
                    Box(t,2.05f,.22f,3.1f,0,.32f,0,wood);
                    foreach(float x in new[]{-.82f,.82f})foreach(float z in new[]{-1.25f,1.25f})Box(t,.14f,.3f,.14f,x,.15f,z,wood);
                    Box(t,2.08f,1.12f,.14f,0,.75f,1.5f,wood); Box(t,1.96f,.32f,2.9f,0,.59f,0,cream);
                    Box(t,1.99f,.12f,2.03f,0,.8f,-.43f,accent); Box(t,1.99f,.06f,.28f,0,.87f,.44f,cream);
                    foreach(float x in new[]{-.49f,.49f})Box(t,.79f,.16f,.49f,x,.83f,1.02f,cream);
                    break;
                case "books":
                    Table(t);for(int i=0;i<3;i++){Box(t,.58f,.025f,.4f,0,.82f+i*.13f,0,accent);Box(t,.54f,.08f,.36f,0,.87f+i*.13f,0,cream);}break;
                case "shelf":
                    foreach(float x in new[]{-.72f,.72f})Box(t,.09f,2,.45f,x,1,0,wood);
                    Box(t,1.5f,2,.06f,0,1,.22f,wood);
                    for(int j=0;j<4;j++){float y=.1f+j*.58f;Box(t,1.5f,.07f,.48f,0,y,0,wood);for(int i=0;i<9;i++)Box(t,.1f,.26f+(i%3)*.06f,.26f,-.59f+i*.145f,y+.2f,0,i%2==0?accent:cream);}break;
                case "lamp":
                    Table(t);Cylinder(t,.2f,.04f,0,.81f,0,metal);Cylinder(t,.025f,.5f,0,1.08f,0,metal);Cylinder(t,.3f,.38f,0,1.4f,0,accent);
                    // An emissive shade avoids additional realtime lights on the headset.
                    accent.EnableKeyword("_EMISSION");accent.SetColor("_EmissionColor",item.definition.color*.4f);break;
                case "rug": Box(t,2.8f,.025f,2.15f,0,.025f,0,accent);foreach(float x in new[]{-1.25f,1.25f})Box(t,.05f,.005f,1.95f,x,.043f,0,cream);break;
                case "plant":
                    Cylinder(t,.23f,.4f,0,.2f,0,wood);Cylinder(t,.025f,.8f,0,.8f,0,wood);
                    for(int i=0;i<7;i++){float a=i*2.4f;Shape(t,PrimitiveType.Sphere,new Vector3(Mathf.Cos(a)*.2f,.65f+i*.08f,Mathf.Sin(a)*.2f),new Vector3(.2f,.42f,.24f),accent);}break;
                case "fan":
                    Table(t);Cylinder(t,.2f,.04f,0,.81f,0,metal);Box(t,.05f,.42f,.05f,0,1.03f,0,metal);
                    var hub = new GameObject("Fan blades");hub.transform.SetParent(t,false);hub.transform.localPosition=new Vector3(0,1.4f,0);item.spinner=hub.transform;
                    for(int i=0;i<3;i++){var blade=Box(hub.transform,.12f,.5f,.035f,0,0,0,accent);blade.transform.localRotation=Quaternion.Euler(0,0,i*120);}
                    Shape(t,PrimitiveType.Sphere,new Vector3(0,1.4f,-.05f),Vector3.one*.12f,metal);break;
                case "clock":
                    Table(t);var clock=Cylinder(t,.26f,.12f,0,1.08f,0,accent);clock.transform.localRotation=Quaternion.Euler(90,0,0);
                    var face=Cylinder(t,.23f,.015f,0,1.08f,-.075f,cream);face.transform.localRotation=Quaternion.Euler(90,0,0);
                    Box(t,.018f,.17f,.02f,0,1.14f,-.09f,dark);Box(t,.13f,.018f,.02f,.06f,1.08f,-.09f,dark);break;
                case "bird": case "rain":
                    Box(t,1.35f,2.1f,.1f,0,1.2f,0,wood);Box(t,1.15f,1.9f,.025f,0,1.2f,-.07f,metal);
                    Box(t,.04f,1.9f,.04f,0,1.2f,-.1f,cream);Box(t,1.2f,.04f,.04f,0,1.4f,-.1f,cream);Box(t,1.5f,.07f,.4f,0,.65f,-.17f,cream);
                    if(item.definition.key=="bird"){
                        Shape(t,PrimitiveType.Sphere,new Vector3(.2f,.85f,-.23f),new Vector3(.3f,.3f,.4f),accent);
                        Shape(t,PrimitiveType.Sphere,new Vector3(.2f,1.02f,-.3f),Vector3.one*.2f,accent);Box(t,.06f,.05f,.12f,.2f,.99f,-.43f,wood);
                    }else for(int i=0;i<18;i++)Box(t,.015f,.08f,.01f,-.5f+(i%6)*.2f,.85f+(i/6)*.5f,-.1f,accent);
                    break;
                case "tv":
                    Box(t,1.55f,.5f,.5f,0,.3f,0,wood);Box(t,1.42f,.83f,.11f,0,1.04f,0,dark);Box(t,1.3f,.71f,.02f,0,1.04f,-.07f,accent);break;
                case "record":
                    Table(t);Box(t,.74f,.1f,.54f,0,.85f,0,accent);Cylinder(t,.22f,.02f,-.08f,.92f,0,dark);Cylinder(t,.06f,.025f,-.08f,.94f,0,cream);Box(t,.025f,.025f,.32f,.24f,.95f,0,metal);break;
                case "piano":
                    Box(t,1.7f,.52f,.75f,0,1.05f,0,dark);Box(t,1.76f,.08f,.85f,0,1.35f,0,wood);
                    for(int i=0;i<21;i++)Box(t,.068f,.05f,.32f,-.74f+i*.074f,.96f,-.48f,cream);
                    foreach(float x in new[]{-.68f,.68f})Box(t,.07f,.8f,.5f,x,.43f,0,dark);break;
                case "drums":
                    var bass=Cylinder(t,.42f,.5f,0,.47f,0,accent);bass.transform.localRotation=Quaternion.Euler(90,0,0);
                    foreach(float x in new[]{-.45f,.45f}){Cylinder(t,.25f,.3f,x,.9f,0,accent);Cylinder(t,.25f,.02f,x,1.06f,0,cream);}
                    foreach(float x in new[]{-.8f,.8f}){Cylinder(t,.025f,1.2f,x,.6f,.35f,metal);Cylinder(t,.38f,.025f,x,1.2f,.35f,metal);}break;
            }
        }
    }
}
