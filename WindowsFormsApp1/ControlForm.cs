using ComVisibleCSharpLibrary;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml;
using System.Xml.Linq;

namespace WindowsFormsApp1
{
    public partial class ControlForm : Form
    {
        private PTouch ptouch;

        private DataThreeD data3D;

        Newtonsoft.Json.Linq.JObject o2;
        public ControlForm()
        {

            InitializeComponent();
            comboBox1.Items.Add("hello.html");
            comboBox1.Items.Add("index.html");
            comboBox1.Items.Add("load3.html");

            ptouch = new PTouch();
            comboBox1.SelectedIndex = 0;
        }

        private void btnShowWindow_Click(object sender, EventArgs e)
        {

            int status;
            string page = comboBox1.Text;
            status = ptouch.ShowForm(page);
            tb1.Text = tb1.Text + $"\r\n status:{status}";
          
        }

        private void btnGetVer_Click(object sender, EventArgs e)
        {
           
            tb1.Text = tb1.Text + ptouch.GetVersion();
        }

        private void openFileDialog1_FileOk(object sender, CancelEventArgs e)
        {

        }

        private void btnSaveJson_Click(object sender, EventArgs e)
        {
            JsonSerializer serializer = new JsonSerializer();
            serializer.Converters.Add(new JavaScriptDateTimeConverter());
            serializer.NullValueHandling = NullValueHandling.Ignore;

            using (StreamWriter sw = new StreamWriter(@"d:\temp\3dData\data3D.json"))
            using (JsonWriter writer = new JsonTextWriter(sw))
            {
                serializer.Serialize(writer, data3D);
                
            }
        }

        private void btnLoadJson_Click(object sender, EventArgs e)
        {
            var filePath = @"D:\work\TTI\_Github\branches\optimoor-3d\Optimoor\WebContent\opt-data.json";
            using (StreamReader file = File.OpenText(filePath))
            {
                using (JsonTextReader reader = new JsonTextReader(file))
                {
                    o2 = (JObject)JToken.ReadFrom(reader);
                    Console.WriteLine($"from Stream {o2}");
                }

            }
            var json = new JObject();
            string jstr = File.ReadAllText(filePath);
            json = JObject.Parse(jstr);
            //Console.WriteLine("-----------------------------------------------");
            //Console.WriteLine($"second from string  {json}");

            data3D = DataThreeD.fromStr(jstr);
            Console.WriteLine($"Version: {data3D.Version}");
            Console.WriteLine($"srcPath: {data3D.srcPath}");
            Console.WriteLine($"BerthName: {data3D.berthName}");
            Console.WriteLine($"HOST.vesselname: {data3D.HOST.vesselname}");

        }

        private void btnInitWeb_Click(object sender, EventArgs e)
        {
            ptouch.InitialiseWebView2();
        }

        private void btnSendCmd_Click(object sender, EventArgs e)
        {
            ptouch.ExecuteScript(tbCommand.Text);
        }

        private void btnHIde_Click(object sender, EventArgs e)
        {
            ptouch.HideForm();
        }

       

       
    }
}
