namespace WindowsFormsApp1
{
    partial class ControlForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.btnShowWindow = new System.Windows.Forms.Button();
            this.comboBox1 = new System.Windows.Forms.ComboBox();
            this.tb1 = new System.Windows.Forms.TextBox();
            this.btnGetVer = new System.Windows.Forms.Button();
            this.btnSaveJson = new System.Windows.Forms.Button();
            this.btnLoadJson = new System.Windows.Forms.Button();
            this.openFileDialog1 = new System.Windows.Forms.OpenFileDialog();
            this.openFileDialog2 = new System.Windows.Forms.OpenFileDialog();
            this.btnInitWeb = new System.Windows.Forms.Button();
            this.btnHIde = new System.Windows.Forms.Button();
            this.tbCommand = new System.Windows.Forms.TextBox();
            this.btnSendCmd = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // btnShowWindow
            // 
            this.btnShowWindow.Location = new System.Drawing.Point(378, 256);
            this.btnShowWindow.Name = "btnShowWindow";
            this.btnShowWindow.Size = new System.Drawing.Size(136, 48);
            this.btnShowWindow.TabIndex = 0;
            this.btnShowWindow.Text = "Show Window";
            this.btnShowWindow.UseVisualStyleBackColor = true;
            this.btnShowWindow.Click += new System.EventHandler(this.btnShowWindow_Click);
            // 
            // comboBox1
            // 
            this.comboBox1.FormattingEnabled = true;
            this.comboBox1.Location = new System.Drawing.Point(192, 267);
            this.comboBox1.Name = "comboBox1";
            this.comboBox1.Size = new System.Drawing.Size(121, 28);
            this.comboBox1.TabIndex = 1;
            // 
            // tb1
            // 
            this.tb1.Location = new System.Drawing.Point(80, 28);
            this.tb1.Multiline = true;
            this.tb1.Name = "tb1";
            this.tb1.Size = new System.Drawing.Size(323, 195);
            this.tb1.TabIndex = 2;
            // 
            // btnGetVer
            // 
            this.btnGetVer.Location = new System.Drawing.Point(545, 63);
            this.btnGetVer.Name = "btnGetVer";
            this.btnGetVer.Size = new System.Drawing.Size(136, 41);
            this.btnGetVer.TabIndex = 3;
            this.btnGetVer.Text = "Get Version";
            this.btnGetVer.UseVisualStyleBackColor = true;
            this.btnGetVer.Click += new System.EventHandler(this.btnGetVer_Click);
            // 
            // btnSaveJson
            // 
            this.btnSaveJson.Location = new System.Drawing.Point(545, 341);
            this.btnSaveJson.Name = "btnSaveJson";
            this.btnSaveJson.Size = new System.Drawing.Size(136, 37);
            this.btnSaveJson.TabIndex = 4;
            this.btnSaveJson.Text = "Save Json";
            this.btnSaveJson.UseVisualStyleBackColor = true;
            this.btnSaveJson.Click += new System.EventHandler(this.btnSaveJson_Click);
            // 
            // btnLoadJson
            // 
            this.btnLoadJson.Location = new System.Drawing.Point(545, 384);
            this.btnLoadJson.Name = "btnLoadJson";
            this.btnLoadJson.Size = new System.Drawing.Size(136, 37);
            this.btnLoadJson.TabIndex = 5;
            this.btnLoadJson.Text = "Load Json";
            this.btnLoadJson.UseVisualStyleBackColor = true;
            this.btnLoadJson.Click += new System.EventHandler(this.btnLoadJson_Click);
            // 
            // openFileDialog1
            // 
            this.openFileDialog1.FileName = "openFileDialog1";
            this.openFileDialog1.FileOk += new System.ComponentModel.CancelEventHandler(this.openFileDialog1_FileOk);
            // 
            // openFileDialog2
            // 
            this.openFileDialog2.FileName = "openFileDialog2";
            // 
            // btnInitWeb
            // 
            this.btnInitWeb.Location = new System.Drawing.Point(557, 150);
            this.btnInitWeb.Name = "btnInitWeb";
            this.btnInitWeb.Size = new System.Drawing.Size(136, 39);
            this.btnInitWeb.TabIndex = 6;
            this.btnInitWeb.Text = "Init Web";
            this.btnInitWeb.UseVisualStyleBackColor = true;
            this.btnInitWeb.Click += new System.EventHandler(this.btnInitWeb_Click);
            // 
            // btnHIde
            // 
            this.btnHIde.Location = new System.Drawing.Point(555, 265);
            this.btnHIde.Name = "btnHIde";
            this.btnHIde.Size = new System.Drawing.Size(157, 38);
            this.btnHIde.TabIndex = 7;
            this.btnHIde.Text = "Hide Window";
            this.btnHIde.UseVisualStyleBackColor = true;
            this.btnHIde.Click += new System.EventHandler(this.btnHIde_Click);
            // 
            // tbCommand
            // 
            this.tbCommand.Location = new System.Drawing.Point(50, 368);
            this.tbCommand.Name = "tbCommand";
            this.tbCommand.Size = new System.Drawing.Size(263, 26);
            this.tbCommand.TabIndex = 8;
            this.tbCommand.Text = "show(\'Msg\')";
            // 
            // btnSendCmd
            // 
            this.btnSendCmd.Location = new System.Drawing.Point(319, 368);
            this.btnSendCmd.Name = "btnSendCmd";
            this.btnSendCmd.Size = new System.Drawing.Size(104, 40);
            this.btnSendCmd.TabIndex = 9;
            this.btnSendCmd.Text = "Send Cmd";
            this.btnSendCmd.UseVisualStyleBackColor = true;
            this.btnSendCmd.Click += new System.EventHandler(this.btnSendCmd_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(50, 340);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(69, 20);
            this.label1.TabIndex = 10;
            this.label1.Text = "Comand";
            // 
            // ControlForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 20F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.btnSendCmd);
            this.Controls.Add(this.tbCommand);
            this.Controls.Add(this.btnHIde);
            this.Controls.Add(this.btnInitWeb);
            this.Controls.Add(this.btnLoadJson);
            this.Controls.Add(this.btnSaveJson);
            this.Controls.Add(this.btnGetVer);
            this.Controls.Add(this.tb1);
            this.Controls.Add(this.comboBox1);
            this.Controls.Add(this.btnShowWindow);
            this.Name = "ControlForm";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button btnShowWindow;
        private System.Windows.Forms.ComboBox comboBox1;
        private System.Windows.Forms.TextBox tb1;
        private System.Windows.Forms.Button btnGetVer;
        private System.Windows.Forms.Button btnSaveJson;
        private System.Windows.Forms.Button btnLoadJson;
        private System.Windows.Forms.OpenFileDialog openFileDialog1;
        private System.Windows.Forms.OpenFileDialog openFileDialog2;
        private System.Windows.Forms.Button btnInitWeb;
        private System.Windows.Forms.Button btnHIde;
        private System.Windows.Forms.TextBox tbCommand;
        private System.Windows.Forms.Button btnSendCmd;
        private System.Windows.Forms.Label label1;
    }
}

