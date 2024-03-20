using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ProgressBar;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using System.IO;
using System.Diagnostics;
using static System.Net.Mime.MediaTypeNames;

namespace ComVisibleCSharpLibrary
{
    public partial class Form1 : Form
    {
        private string _page;
        //create new instance of WebView2
        Microsoft.Web.WebView2.WinForms.WebView2 webView21 = new Microsoft.Web.WebView2.WinForms.WebView2();

        //string docPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        string docPath = System.AppDomain.CurrentDomain.BaseDirectory;
        public void SetPage(string page)
        {
            SimpleLog.LogText($"info: Set Page:{page} ");
            _page = page;
            webView21.Source = new Uri($"http://localfiles/{_page}", UriKind.Absolute);
        }

            public Form1(string page)
        {

            SimpleLog.LogText("Info: Created form");
            InitializeComponent();


            _page = page;
            SimpleLog.LogText($"Info: Set page {_page}");


            webView21.Location = new System.Drawing.Point(10, 10);
            webView21.Size = new System.Drawing.Size(800, 600);
            webView21.Dock = DockStyle.Fill;
            //don't set Source property here

            SimpleLog.LogText("Info: Added webView21");
           

            this.Controls.Add(webView21);

            SimpleLog.LogText("Info: EnsureCoreWebView2Async");

            //initialize CoreWebView2
            //await InitializeAsync();
            InitializeAsync();

            SimpleLog.LogText("Info: after initializing CoreWebView2");

            //webView21.EnsureCoreWebView2Async(null);


            //MessageBox.Show("Info: Navigate");
            //if (webView21 != null && webView21.CoreWebView2 != null)
            //{
            //navigate to website - option 1
            //    webView21.Source = new Uri("https://www.microsoft.com", UriKind.Absolute);

            //navigate to website - option 2
            //webView21.CoreWebView2.Navigate("https://www.microsoft.com");
            //}//i

            //InitializeWebView();


        }


        private async Task InitializeAsync()
        {
            SimpleLog.LogText("--------------------------------------------------");
            SimpleLog.LogText("Info: InitializeAsync");

            //var tempPath = Path.GetTempPath();
            var tempPath = $"./work";

            bool exists = System.IO.Directory.Exists(tempPath);

            if (!exists)
                System.IO.Directory.CreateDirectory(tempPath);


            SimpleLog.LogText($"Info: tempPath {tempPath}");


            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: Path.Combine(tempPath, "Content_Browser"));

            SimpleLog.LogText("Info: Created env");
            SimpleLog.LogText($"Info: env.UserDataFolder {env.UserDataFolder}");


            // wait for coreWebView2 initialization
            await webView21.EnsureCoreWebView2Async(env);

            SimpleLog.LogText("Info: After EnsureCoreWebView2Async");


            //if (openDevTools)
            //     webView21.CoreWebView2.OpenDevToolsWindow

            SetVirtualHostNameToFolderMapping();


            //webView21.Source = new Uri("https://google.co.uk");

            if (_page.Length < 2) _page = "hello.html";


            var pageUrl = $"http://localfiles/{_page}";

            SimpleLog.LogText($"Info: Set source: {pageUrl}");


            webView21.Source = new Uri(pageUrl, UriKind.Absolute);
           

            SimpleLog.LogText("Info: after EnsureCoreWebView2Async");
        }

       

        private void webView21_CoreWebView2Ready(object sender, EventArgs e)
        {
            MessageBox.Show("Info: webView21_CoreWebView2Ready");

            //subscribe to events (add event handlers) - CoreWebView2
            //webView21.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;

            //subscribe to events (add event handlers) - WebView2
            //webView21.NavigationStarting += webView21_NavigationStarting;
            //webView21.NavigationCompleted += webView21_NavigationCompleted;

            MessageBox.Show("Info: leaving webView21_CoreWebView2Ready");
        }



      

        private async void SetVirtualHostNameToFolderMapping()
        {
            SimpleLog.LogText("Info: SetVirtualHostNameToFolderMapping");

            //string resourcePath = @"D:\dev\WebView2-Resource";
            string resourcePath = @".\WebView2Content";

            SimpleLog.LogText($"Info: resourcePath: {resourcePath}");

            //string resourcePath = @".\StaticWebView";

            webView21.CoreWebView2.SetVirtualHostNameToFolderMapping("localfiles", resourcePath, CoreWebView2HostResourceAccessKind.Allow);
        }

    }
}
