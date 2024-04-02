using ComVisibleCSharpLibrary;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        private PTouch ptouch;
        public Form1()
        {
            InitializeComponent();
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
    }
}
