using System;
using UnityEngine;

namespace SoundRoom
{
    [Serializable]
    public sealed class BedroomItem
    {
        public string key, title, sound;
        public Color color;
        public float radius, volume;
        public BedroomItem(string key, string title, string sound, string hex, float radius, float volume = .3f)
        {
            this.key = key; this.title = title; this.sound = sound; this.radius = radius; this.volume = volume;
            ColorUtility.TryParseHtmlString(hex, out color);
        }
    }

    public static class BedroomCatalog
    {
        public static readonly BedroomItem[] All = {
            new BedroomItem("bed", "Bed", null, "#A8C9AC", 1.7f),
            new BedroomItem("books", "Books / pages", "pages", "#E7BE8E", .65f),
            new BedroomItem("shelf", "Bookshelf", null, "#C49C78", .9f),
            new BedroomItem("lamp", "Bedside lamp", null, "#FFE2A3", .65f),
            new BedroomItem("rug", "Rug", null, "#B4A7CC", 1.5f),
            new BedroomItem("plant", "Houseplant", null, "#9EC998", .6f),
            new BedroomItem("fan", "Desk fan", "fan", "#9BCBD3", .65f, .22f),
            new BedroomItem("clock", "Ticking clock", "clock", "#F2BF81", .65f, .25f),
            new BedroomItem("bird", "Bird / chirping", "bird", "#EFD887", .8f, .35f),
            new BedroomItem("tv", "Television", "tv", "#A6B9E5", .9f, .2f),
            new BedroomItem("record", "Record player", "record", "#E6B9AD", .7f, .4f),
            new BedroomItem("rain", "Rain window", "rain", "#8DC8E8", .85f, .25f),
            new BedroomItem("piano", "Piano", "piano", "#D6F48A", 1.05f, .5f),
            new BedroomItem("drums", "Drummer", "drums", "#F4B879", 1.05f, .5f)
        };
        public static BedroomItem Find(string key) => Array.Find(All, item => item.key == key);
    }

    public sealed class BedroomObject : MonoBehaviour
    {
        public BedroomItem definition;
        public AudioSource sound;
        public Transform spinner;
        public bool muted;
        public float volume;
        public void SetVolume(float value)
        {
            volume = Mathf.Clamp01(value);
            if (sound != null) sound.volume = muted ? 0 : volume;
        }
        public void ToggleMute() { muted = !muted; SetVolume(volume); }
        void Update() { if (spinner != null && !muted) spinner.Rotate(Vector3.forward, -500 * Time.deltaTime); }
    }
}
